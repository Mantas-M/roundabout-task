"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const express_1 = __importDefault(require("express"));
const twitter_api_v2_1 = __importStar(require("twitter-api-v2"));
const bearerToken = process.env.BEARER_TOKEN;
const screenName = process.env.SCREEN_NAME;
const app = (0, express_1.default)();
const twitterClient = new twitter_api_v2_1.default(bearerToken);
app.get('/tweets', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const previousTweetData = yield getPreviousTweets();
    res.send(previousTweetData);
    yield setupRules();
    const stream = twitterClient.v2.searchStream({ autoConnect: false });
    stream.on(twitter_api_v2_1.ETwitterStreamEvent.Data, tweet => {
        console.log(tweet.data);
        //Could do anything with the newly received tweets
    });
    stream.on(twitter_api_v2_1.ETwitterStreamEvent.Connected, () => console.log('Stream is started'));
    yield stream.connect({ autoReconnect: true, autoReconnectRetries: Infinity });
    req.on('close', () => {
        console.log('Stopping stream');
        stream.destroy();
    });
}));
const setupRules = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Setting up filtering rules...');
    const rules = yield twitterClient.v2.streamRules();
    console.log('Checking rules from previous session...');
    if (Array.isArray(rules.data)) {
        const ids = rules.data.map(rule => rule.id);
        console.log('Deleting rules from previous session...');
        yield twitterClient.v2.updateStreamRules({ delete: { ids } });
    }
    else
        console.log('No rules previously set...');
    yield addStreamRules();
    console.log('Rule setup completed ✔');
});
const addStreamRules = () => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield twitterClient.v2.userByUsername(screenName);
    console.log(`Adding rule to filter tweets from user @${screenName}`);
    yield twitterClient.v2.updateStreamRules({
        add: [
            { value: `from:${user.data.id}`, tag: "User ID to filer tweets from" }
        ]
    });
    console.log('Rules added succesfully ✔');
});
const getPreviousTweets = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Getting previous tweets...');
    const user = yield twitterClient.v2.userByUsername(screenName);
    const userTimeline = yield twitterClient.v2.userTimeline(user.data.id, { exclude: 'replies', max_results: 100 });
    console.log('Got previous tweets succesfully ✔');
    return userTimeline.data.data;
});
// Start express app
app.listen(3000, () => {
    console.log('Server listening on port 3000');
});

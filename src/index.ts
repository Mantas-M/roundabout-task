import * as dotenv from 'dotenv'
dotenv.config()
import express from 'express';
import TwitterApi, { ETwitterStreamEvent } from 'twitter-api-v2';

const bearerToken = process.env.BEARER_TOKEN!
const screenName = process.env.SCREEN_NAME!

const app = express();

const twitterClient = new TwitterApi(bearerToken)
app.get('/tweets', async (req, res) => {
    const previousTweetData = await getPreviousTweets()

    res.send(previousTweetData)

    await setupRules()

    const stream = twitterClient.v2.searchStream({autoConnect: false});

    stream.on(ETwitterStreamEvent.Data, tweet => {
        console.log(tweet.data)
        //Could do anything with the newly received tweets
    })
    stream.on(ETwitterStreamEvent.Connected, () => console.log('Stream is started'))

    await stream.connect({ autoReconnect: true, autoReconnectRetries: Infinity })

    req.on('close', ()=> {
        console.log('Stopping stream')
        stream.destroy()
    })
});

const setupRules = async () => {
    console.log('Setting up filtering rules...')
    const rules = await twitterClient.v2.streamRules();

    console.log('Checking rules from previous session...')
    if (Array.isArray(rules.data)) {
        const ids = rules.data.map(rule => rule.id)
        console.log('Deleting rules from previous session...')
        await twitterClient.v2.updateStreamRules({delete: {ids}})
    } else console.log('No rules previously set...')
    
    await addStreamRules()
    console.log('Rule setup completed ✔')
}

const addStreamRules =async () => {
    const user = await twitterClient.v2.userByUsername(screenName)
    console.log(`Adding rule to filter tweets from user @${screenName}`)
    await twitterClient.v2.updateStreamRules({
        add: [
            { value: `from:${user.data.id}`, tag: "User ID to filer tweets from" }
        ]
    })
    console.log('Rules added succesfully ✔')
}

const getPreviousTweets = async () => {
    console.log('Getting previous tweets...')
    const user = await twitterClient.v2.userByUsername(screenName);
    const userTimeline =  await twitterClient.v2.userTimeline(user.data.id, { exclude: 'replies', max_results:100 })
    console.log('Got previous tweets succesfully ✔')
    return userTimeline.data.data
}

// Start express app
app.listen(3000, () => {
    console.log('Server listening on port 3000');
});


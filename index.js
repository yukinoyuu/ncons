const dotenv = require("dotenv")
const { Client } = require("@notionhq/client")
const moment = require("moment")

dotenv.config()

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const databaseId = process.env.NOTION_DATABASE_ID
const ytApiKey = process.env.YOUTUBE_API_KEY

const fetchYtData = async (url) => {
    const videoId = url.slice(32)

    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${ytApiKey}`)
    const data = await res.json()

    return {
        name: data.items[0].snippet.title,
        author: data.items[0].snippet.channelTitle,
        duration: moment.duration(data.items[0].contentDetails.duration).asSeconds(),
        link: url,
        channelId: data.items[0].snippet.channelId
    }
}

const addConsumption = async ( { name, author, duration, link, channelId } ) => {
    try{
        const Now = new Date()
        const After = new Date(Date.now() + duration * 1000)

        const res = await notion.pages.create({
            parent: {
                'database_id': databaseId
            },
            properties: {
                Name: {
                    type: 'title',
                    title: [{ type: 'text', text: { content: name, link: {url: link}} }]
                },
                Author: {
                    type: 'rich_text',
                    rich_text: [{ type: 'text', text: { content: author, link: {url: `https://www.youtube.com/channel/${channelId}`} } }]
                },
                Status: {
                    status: {
                        name: 'Done'
                    }
                },
                Rating: {
                    select: {
                        name: 'N/A'
                    } 
                },
                Duration: {
                    type: "number",
                    number: Math.round(duration / 60)
                    // rich_text: [{ type: 'text', text: { content: Math.round(duration / 60).toString() } }]
                },
                Date: {
                    type: 'rich_text',
                    rich_text: [
                        {
                            type: 'mention',
                            mention: {
                                type: 'date',
                                date: {
                                    time_zone: "America/Chicago",
                                    start: Now.toISOString(),
                                    end: After.toISOString()
                                }
                            }
                        }
                    ]
                },
            }
        })
        console.log(res)
    } catch (err) {
        console.log(err)
    }
}

const main = async () => {
    const data = await fetchYtData(process.argv[2])
    addConsumption(data)
}

main()
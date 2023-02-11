const axios = require("axios")
const fs = require("fs")

console.log("Discord Ban Script")
console.log("LP yapti;")

let useridler = fs.readFileSync("useridler.txt", "utf-8").split("\n")
let token = "Bot MTA0MTM3Mzg4NDc5ODIxNDE5NA.GT4uy2.-z4wksHomX2w9o0Ew2-T_RGiM3ZKU5svUGgAm0"
let guildid = process.argv[2]

if (!guildid){
    console.log("Lütfen bir guild id giriniz.")
    return;
} 

const banQueue = new Map();
const activeBans = new Map();

console.log(`Found ${useridler.length} user IDs in the list`);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function banUser(userid, reason){
    try {
        let ban = await axios.put(`https://discord.com/api/v10/guilds/${guildid}/bans/${userid}?delete-message-days=0&reason=${encodeURIComponent(reason)}`, {}, {
            headers: {
                "Authorization": token,
                "Content-Type": "application/json",
                "User-Agent": "DiscordBot ( https://discord.com, 0.1 )",
            }
        })
        return ban.data;
    } catch (error) {
        // if axios error code is 429, wait X-RateLimit-Reset-After seconds
        if(error.response.status == 429){
            console.log("Rate limit exceeded. Waiting... " + error.response.headers["x-ratelimit-reset-after"])
            await sleep(error.response.headers["x-ratelimit-reset-after"] * 1000)
            return await banUser(userid, reason)
        }else if(error.response.status == 404){
            console.log("User not found." + userid)
            fs.appendFileSync("notfound.txt", userid + "\n")

        }else{
            console.error(error)
        }
    }
}


async function listbans(afterid){
    let ur = ""
    if(afterid){
        ur = `&after=${afterid}`
    }
    try {
        let bans = await axios.get(`https://discord.com/api/v10/guilds/${guildid}/bans?limit=1000` + ur, {
            headers: {
                "Authorization": token,
                "Content-Type": "application/json",
                "User-Agent": "DiscordBot ( https://discord.com, 0.1 )",
            }
        })
        if(bans.data.length == 1000){
            return bans.data.concat(await listbans(bans.data[bans.data.length - 1].user.id))
        }
    
        return bans.data;
    } catch (error) {
        // if axios error code is 429, wait X-RateLimit-Reset-After seconds
        if(error.response.status == 429){
            console.log("Rate limit exceeded. Waiting... " + error.response.headers["x-ratelimit-reset-after"])
            await sleep(error.response.headers["x-ratelimit-reset-after"] * 1000)
            return await listbans(afterid)
        }else{
            console.error(error)
        }
    }



}

async function bot(){
    // list bans of guild
    console.log("Banlar cacheleniyor...")
    let bans = await listbans()
    console.log(`Guild'da ${bans.length} ban bulundu.`)
    // save bans to activeBans map only id
    bans.forEach(ban => {
        activeBans.set(ban.user.id, ban)
    })
    // loop through user ids and ban them if not banned
    for (let i = 0; i < useridler.length; i++) {
        let userid = useridler[i]
        if(!activeBans.has(userid)){
            await banUser(userid, "Discord Cross Ban (LP#7750)")
        }
    }

    console.log("Script tamamlandi!")





}

bot()
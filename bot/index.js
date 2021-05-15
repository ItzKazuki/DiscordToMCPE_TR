let Discord = null;try {Discord = require("discord.js");} catch(e) {
// Eğer bu satıra atan bir hata alıyorsan alttaki yazıyı oku.
throw new Error("discord.js modülünü yüklemelisin!");}

let express = null;try {express = require("express");} catch(e) {
// Eğer bu satıra atan bir hata alıyorsan alttaki yazıyı oku.
throw new Error("express modülünü yüklemelisin!");}

let fs = null;try {fs = require("fs");} catch(e) {
// Eğer bu satıra atan bir hata alıyorsan alttaki yazıyı oku.
throw new Error("fs modülünü yüklemelisin!");}

let request = null;try {request = require("request");} catch(e) {
// Eğer bu satıra atan bir hata alıyorsan alttaki yazıyı oku.
throw new Error("request modülünü yüklemelisin!");}

const client = new Discord.Client();
function r(t){return t;}
let chalk = {red:r,greenBright:r,blue:r,yellowBright:r};try{chalk = require("chalk");}catch(e){console.log("chalk modülü bulunamadı, yazılar renkli olmayacak.")}
const config = require("./config.js");

let db = null;try {db = require("quick.db");console.log(chalk.greenBright("Veritabanı merkezi quick.db olarak belirlendi."));} catch(e) {try {let {JsonDatabase} = require("wio.db");db = new JsonDatabase("wiodata");console.log(chalk.greenBright("Veritabanı merkezi wio.db olarak belirlendi."));} catch(e) {try {require("fs");db = require("./jsondb.js");console.log(chalk.greenBright("Veritabanı merkezi JSON(fs) olarak belirlendi."));} catch(e) {
// Eğer bu satıra atan bir hata alıyorsan alttaki yazıyı oku.
throw new Error(chalk.red("wio.db, quick.db veya fs modülünü yüklemelisin!"));}}}
client.db = db;
client.chalk = chalk;
client.config = config;
client.request = request;
client.currentrcon = null;
client.setRcon=async function(ret = false, rett = false, rettt = true) {
    if(ret)console.log(chalk.greenBright("RCON'a bağlanılıyor..."));
    try {
        let {Rcon} = require("rcon-client");
        let rcon = new Rcon({timeout: config.server.rcon.refresh,host: config.server.ip,port: config.server.port,password: config.server.rcon.password});
        try {
            await rcon.connect();
            if(ret || rett)console.log(chalk.greenBright("RCON'a bağlanıldı."));
            client.currentrcon = rcon;
            setTimeout(function(){
                if(rcon.socket && !rcon.socket.connecting) {
                    rcon.end();
                    client.setRcon();
                } else {
                    console.log(chalk.yellowBright("RCON ile olan bağlantı kesildi, geri bağlanılıyor."));
                    client.setRcon(true);
                }
            },config.server.rcon.refresh-1000)
        }catch(e){
            if(e.code) {
                if(rettt)console.log(chalk.red("Sunucu kapalı, tekrar bağlanılmaya devam edilecek ve bağlanılırsa geri dönüş yapılacak."));
                client.setRcon(false, true, false);
            } else {
                console.log(chalk.red("Hatalı rcon şifresi girildi."));
            }
        }
    }catch(e){console.log(chalk.red("rcon-client modülü bulunamadı."))}
}
client.sendMessage=async function(player,message){
    if(!client.currentrcon) await client.setRcon();
    if(client.currentrcon.socket && !client.currentrcon.socket.connecting) {
        client.currentrcon.send("exrcon sendmessage \""+player +"\" \""+message+"\"");
    } else {
        console.log(chalk.yellowBright("RCON ile olan bağlantı kesildi, geri bağlanılıyor."));
        client.setRcon(true);
    }
};
client.on("ready", async () => {
    console.log(chalk.greenBright("Token doğrulandı, giriş yapıldı ve bot aktif edildi."));
    await client.setRcon(true);
    if(client.currentrcon && client.currentrcon.socket && !client.currentrcon.socket.connecting)client.currentrcon.send("exrcon getplayers");
    let guild = client.guilds.cache.get(config.vote.voteguild);
    if(config.vote.enabled && guild && guild.channels.cache.get(config.vote.votechannel) && guild.channels.cache.get(config.vote.votechannel).type == "text") {
        let kanal = guild.channels.cache.get(config.vote.votechannel);
        setInterval(function(){
            request("https://minecraftpocket-servers.com/api/?object=servers&element=voters&key="+config.vote.apikey+"&month=current&format=json", (err,res)=>{
                if(err) return console.log(err);
                // Eğer bu satıra gelen bir hata verdiyse API keyiniz hatalıdır. Configden düzeltin.
                if(res.body == "Error: server key not found" || res.body == "Error: invalid server key") throw new Error("Geçersiz API anahtarı.");
                let votes = JSON.parse(res.body).voters;
                let votesLog = db.get("votes") || [];
                votes.forEach(i=> {
                    let index = votes.indexOf(i);
                    if(votesLog.some(a=> a.nickname == i.nickname && a.votes > i.votes)) {
                        votes[index] = i;
                        kanal.send(i.nickname+" bu ay "+(i.votes+1)+". kez oy verdi!");
                    } else if(!votesLog.some(a=> a.nickname == i.nickname)) {
                        votes.push(i);
                        kanal.send(i.nickname+" sunucuya oy verdi!");
                    }
                });
                db.set("votes", votes);
            })
        }, 10000);
    }
    if(config.talepsistem.enabled) {
        if(client.currentrcon && client.currentrcon.socket && !client.currentrcon.socket.connecting)client.currentrcon.send("exrcon registercmd 0 \"" +config.talepsistem.commandopen+"\" \""+config.talepsistem.commandopendesc+"\"");
        if(client.currentrcon && client.currentrcon.socket && !client.currentrcon.socket.connecting)client.currentrcon.send("exrcon registercmd 1 \"" +config.talepsistem.commandclose+"\" \""+config.talepsistem.commandclosedesc+"\"");
        if(client.currentrcon && client.currentrcon.socket && !client.currentrcon.socket.connecting)client.currentrcon.send("exrcon registercmd 2 \"" +config.talepsistem.commandchat+"\" \""+config.talepsistem.commandchatdesc+"\"");
    }
    client.cmds = fs.readdirSync("./commands").filter(i=> i.endsWith(".js") && typeof(require("./commands/"+i)) == "object").map(i=> {
        return {
            name: require("./commands/"+i).name,
            execute: require("./commands/"+i).execute,
            file: i
        };
    });
    client.cmds.forEach(i=> {
        if(typeof(i.name) != "string") throw new Error("İsimsiz komut: "+i.file);
        if(typeof(i.execute) != "function") throw new Error("Fonksiyonsuz komut: "+i.file);
    });
})

async function onMessage(m){
    let {prefix} = config;
    if(!m.content.startsWith(prefix) || m.author.bot || m.channel.type != "text") return;
    let arg = m.content.split(prefix)[1].split(" ");
    let komut = arg[0];
    let args = arg.slice(1);
    if(client.cmds.map(i=> i.name).includes(komut)) {
        komut = client.cmds.filter(i=> i.name == komut)[0];
        komut.execute(m, args, config);
    }
}

async function onWebhookMessage(m){
    m = m.split("").slice(0,m-6).join("");
    require("./server/events/EventListener")(m.split(";")[0], m.split(";")[1], m.split(";")[2], m.split(";").slice(3));
}

async function talepHandler(m){
    let talepler = await db.fetchAll();
    if(m.author.bot) return;
    if(talepler[0] && talepler[0].ID) {
        talepler.filter(i=> i.ID.startsWith("talep_")).forEach(i=> {
            if(i.data.channelID == m.channel.id) {
                client.sendMessage(i.data.playerName, "§e§lTALEP §r§8[§b"+(m.member.roles.color ? m.member.roles.color.name : "")+"§8] §c"+m.author.tag+" §a> §b"+m.content);
            }
        })
    } else if(db.pin){
        Object.keys(talepler).forEach(i=> {
            if(!i.startsWith("talep_")) {
                delete talepler[i];
            } else if(talepler[i].channelID == m.channel.id) {
                client.sendMessage(talepler[i].playerName, "§e§lTALEP §r§8[§b"+(m.member.roles.color ? m.member.roles.color.name : "")+"§8] §c"+m.author.tag+" §a> §b"+m.content);
            }
        });
    }
}

client.on("message", async m => {
    await onMessage(m);
    await talepHandler(m);
})

client.login(config.token)
.catch(e => {
    if(e.code == "TOKEN_INVALID") {
        // Eğer bu satıra atan bir hata alıyorsan alttaki yazıyı oku.
        throw new Error("Hatalı token! Lütfen config.js'teki tokeni kontrol et.");
    } else console.error(e);
})

if(!fs.readFileSync("./key.txt").toString("utf-8")) {
    let psb = "abcdefghijklmnoprstuvyzABCDEFGHIJKLMNOPRSTUVYZ1234567890!?=+-*/\\'\"{[()]}".split("");
    fs.writeFileSync("./key.txt", ("0".repeat(50).split("").map(i=> psb[Math.floor(Math.random()*psb.length)]).join("")));
    console.log(chalk.blue("Anahtar üretildi!"));
}

const key = fs.readFileSync("./key.txt").toString("utf-8");

/*

Bir sorun ile karşılaştırsanız bana mesaj atmaktan çekinmeyin:
Discord: Oğuzhan#6561

*/


const app = express();

app.get("/", (req,res) => {
    if((new Buffer(req.query.key, "base64")).toString("utf-8") == key && req.query.message) {
        let message = (new Buffer(req.query.message, "base64")).toString("utf-8");
        onWebhookMessage(message);
    }
})

app.listen(3000);

module.exports = {getClient:function(){return client;}};

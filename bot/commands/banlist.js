module.exports = {
    name: "banliste",
    execute: async function (m, args, config) {
        if (!m.member.hasPermission("ADMINISTRATOR")) return m.reply("Bu komudu kullanabilmek için `Yönetici` olman gerekiyor.");
        if (!config.server.rcon.enabled) return m.reply("Rcon devre dışı bırakıldığından bu komudu kullanamazsınız.");
        try {
            let { Rcon } = require("rcon-client");
            let rcon = new Rcon({
                host: config.server.ip,
                port: config.server.port,
                password: config.server.rcon.password
            });
            try {
                rcon.connect().then(async qq => {
                    let result = await Promise.all([rcon.send("banlist")]);
                    let bannedplayers = result[0].split("\r\n")[1] || "Kimse";
                    await m.reply("Sunucudan uzaklaştırılmış oyuncular: " + bannedplayers);
                    rcon.end();
                })
            } catch (e) {
                m.reply("Lütfen config'i kontrol edin! Hatalı rcon şifresi veya sunucuda rcon aktif değil.");
            }
        } catch (e) {
            m.reply("Bu komudu kullanılabilir hale getirmek için lütfen `rcon-client` modülünü yükleyin.");
        }
    }
}
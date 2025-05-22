const { EmbedBuilder } = require("discord.js")

async function notAllowed(customText){
    return new EmbedBuilder()
    .setDescription(customText ?? `<:Arrow:1361120667386515516> You are **not allowed** to use this command!`)
    .setColor("Red")
}

module.exports = {notAllowed}
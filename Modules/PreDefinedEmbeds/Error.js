const { EmbedBuilder } = require("discord.js")

async function error(err, customText){
    return new EmbedBuilder()
    .setDescription(customText ?? `<:Arrow:1361120667386515516> **An error has occurred**! Please report this to a member of the development team **immediately**.
\`\`\`${err.message}\`\`\``)
    .setColor("Red")
}

module.exports = {error}
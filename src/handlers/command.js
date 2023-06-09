module.exports = (client) => {
    const loadCommands = require("../helpers/loadCommands");

    loadCommands(client);

    const emoji = require("../config.json").emojis;

    client.logCommandError = async function(err, interaction, Discord) {
        console.error(err);

        const error = new Discord.EmbedBuilder()
            .setColor(client.config_embeds.error)
            .setDescription(`${emoji.error} An error occurred!`)

        await interaction.editReply({ embeds: [error] });
    }

    require("dotenv").config();
}
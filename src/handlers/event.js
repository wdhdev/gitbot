module.exports = (client, Discord) => {
    const loadEvents = require("../helpers/loadEvents");

    loadEvents(client, Discord);

    const emoji = require("../config.json").emojis;

    client.logEventError = async function(err, interaction, Discord) {
        console.error(err);

        const error = new Discord.EmbedBuilder()
            .setColor(client.config_embeds.error)
            .setDescription(`${emoji.error} There was an error while executing that command!`)

        await interaction.editReply({ embeds: [error] });
    }

    require("dotenv").config();
}
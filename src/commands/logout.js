const emoji = require("../config.json").emojis;
const schema = require("../models/userSchema");

module.exports = {
	name: "logout",
	description: "Logout of your GitHub account",
    options: [],
    botPermissions: [],
    cooldown: 5,
    enabled: true,
	async execute(interaction, client, Discord) {
        try {
            if(await schema.exists({ _id: interaction.user.id })) {
                await schema.findByIdAndDelete({ _id: interaction.user.id });

                const loggedOut = new Discord.EmbedBuilder()
                    .setColor(client.config_embeds.default)
                    .setDescription(`${emoji.successful} You have been logged out!`)

                await interaction.editReply({ embeds: [loggedOut] });
                return;
            }

            const error = new Discord.EmbedBuilder()
                .setColor(client.config_embeds.error)
                .setDescription(`${emoji.error} You are not logged in!`)

            await interaction.editReply({ embeds: [error] });
        } catch(err) {
            client.logCommandError(err, interaction, Discord);
        }
    }
}
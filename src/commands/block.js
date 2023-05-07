const emoji = require("../config.json").emojis;
const { Octokit } = require("@octokit/core");
const schema = require("../models/githubUserSchema");

module.exports = {
	name: "block",
	description: "Block a GitHub user",
    options: [
        {
            type: 3,
            name: "username",
            description: "The GitHub username of the person you want to block.",
            required: true
        }
    ],
    userPermissions: [],
    botPermissions: [],
    cooldown: 5,
    enabled: true,
	async execute(interaction, client, Discord) {
        try {
            const username = interaction.options.getString("username").toLowerCase();

            if(!await schema.exists({ _id: interaction.user.id })) {
                const error = new Discord.EmbedBuilder()
                    .setColor(client.config_embeds.error)
                    .setDescription(`${emoji.error} You are not logged in!`)

                await interaction.editReply({ embeds: [error] });
                return;
            }

            schema.findOne({ _id: interaction.user.id }, async (err, data) => {
                const octokit = new Octokit({ auth: data.token });

                try {
                    await octokit.request("PUT /user/blocks/{username}", {
                        username: username
                    })

                    const blocked = new Discord.EmbedBuilder()
                        .setColor(client.config_embeds.default)
                        .setDescription(`${emoji.successful} Blocked [\`${username}\`](https://github.com/${username})`)

                    await interaction.editReply({ embeds: [blocked] });
                } catch {
                    const error = new Discord.EmbedBuilder()
                        .setColor(client.config_embeds.error)
                        .setDescription(`${emoji.error} Could not block [\`${username}\`](https://github.com/${username}).`)

                    await interaction.editReply({ embeds: [error] });
                    return;
                }
            })
        } catch(err) {
            client.logCommandError(interaction, Discord);
        }
    }
}
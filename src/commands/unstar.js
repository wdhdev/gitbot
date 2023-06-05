const emoji = require("../config.json").emojis;
const { Octokit } = require("@octokit/core");
const schema = require("../models/userSchema");

module.exports = {
	name: "unstar",
	description: "Unstar a GitHub repository",
    options: [
        {
            type: 3,
            name: "owner",
            description: "The owner of the repository you want to unstar.",
            required: true
        },

        {
            type: 3,
            name: "repo",
            description: "The repository you want to unstar.",
            required: true
        }
    ],
    botPermissions: [],
    cooldown: 5,
    enabled: true,
	async execute(interaction, client, Discord) {
        try {
            const owner = interaction.options.getString("owner").toLowerCase();
            const repo = interaction.options.getString("repo").toLowerCase();

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
                    await octokit.request("GET /user/starred/{owner}/{repo}", {
                        owner: owner,
                        repo: repo
                    })
                } catch(err) {
                    if(err.status === 404) {
                        const error = new Discord.EmbedBuilder()
                            .setColor(client.config_embeds.error)
                            .setDescription(`${emoji.error} You haven't starred [\`${owner}/${repo}\`](https://github.com/${owner}/${repo}).`)

                        await interaction.editReply({ embeds: [error] });
                        return;
                    }
                }

                try {
                    await octokit.request("DELETE /user/starred/{owner}/{repo}", {
                        owner: owner,
                        repo: repo
                    })
                } catch(err) {
                    const error = new Discord.EmbedBuilder()
                        .setColor(client.config_embeds.error)
                        .setDescription(`${emoji.error} Could not unstar [\`${owner}/${repo}\`](https://github.com/${owner}/${repo}).`)

                    await interaction.editReply({ embeds: [error] });
                    return;
                }

                const unstarred = new Discord.EmbedBuilder()
                    .setColor(client.config_embeds.default)
                    .setDescription(`${emoji.successful} Unstarred [\`${owner}/${repo}\`](https://github.com/${owner}/${repo})`)

                await interaction.editReply({ embeds: [unstarred] });
            })
        } catch(err) {
            client.logCommandError(err, interaction, Discord);
        }
    }
}
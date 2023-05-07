const emoji = require("../config.json").emojis;
const { Octokit } = require("@octokit/core");
const schema = require("../models/githubUserSchema");

module.exports = {
	name: "star",
	description: "Star a GitHub repository",
    options: [
        {
            type: 3,
            name: "owner",
            description: "The owner of the repository you want to star.",
            required: true
        },

        {
            type: 3,
            name: "repo",
            description: "The repository you want to star.",
            required: true
        }
    ],
    userPermissions: [],
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
                    const res = await octokit.request("GET /user/starred/{owner}/{repo}", {
                        owner: owner,
                        repo: repo
                    })

                    if(res.status === 204) {
                        const error = new Discord.EmbedBuilder()
                            .setColor(client.config_embeds.error)
                            .setDescription(`${emoji.error} You have already starred [\`${owner}/${repo}\`](https://github.com/${owner}/${repo}).`)

                        await interaction.editReply({ embeds: [error] });
                        return;
                    }
                } catch {}

                try {
                    await octokit.request("PUT /user/starred/{owner}/{repo}", {
                        owner: owner,
                        repo: repo
                    })
                } catch(err) {
                    const error = new Discord.EmbedBuilder()
                        .setColor(client.config_embeds.error)
                        .setDescription(`${emoji.error} Could not star [\`${owner}/${repo}\`](https://github.com/${owner}/${repo}).`)

                    await interaction.editReply({ embeds: [error] });
                    return;
                }

                const starred = new Discord.EmbedBuilder()
                    .setColor(client.config_embeds.default)
                    .setDescription(`${emoji.star} Starred [\`${owner}/${repo}\`](https://github.com/${owner}/${repo})`)

                await interaction.editReply({ embeds: [starred] });
            })
        } catch(err) {
            client.logCommandError(interaction, Discord);
        }
    }
}
const emoji = require("../config.json").emojis;
const { Octokit } = require("@octokit/core");
const schema = require("../models/userSchema");

module.exports = {
	name: "fork",
	description: "Fork a GitHub repository",
    options: [
        {
            type: 3,
            name: "owner",
            description: "The owner of the repository you want to fork.",
            required: true
        },

        {
            type: 3,
            name: "repo",
            description: "The repository you want to fork.",
            required: true
        },

        {
            type: 5,
            name: "default_branch_only",
            description: "Do you want to copy branches other than the primary branch?",
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
            const default_branch_only = interaction.options.getBoolean("default_branch_only");

            if(!await schema.exists({ _id: interaction.user.id })) {
                const error = new Discord.EmbedBuilder()
                    .setColor(client.config_embeds.error)
                    .setDescription(`${emoji.error} You are not logged in!`)

                await interaction.editReply({ embeds: [error] });
                return;
            }

            let forkName;

            schema.findOne({ _id: interaction.user.id }, async (err, data) => {
                const octokit = new Octokit({ auth: data.token });

                try {
                    await octokit.request("POST /repos/{owner}/{repo}/forks", {
                        owner: owner,
                        repo: repo,
                        default_branch_only: default_branch_only
                    }).then(res => forkName = res.data.name)

                    const forked = new Discord.EmbedBuilder()
                        .setColor(client.config_embeds.default)
                        .setDescription(`${emoji.successful} Forked [\`${owner}/${repo}\`](https://github.com/${owner}/${repo}) to [\`${data.username}/${forkName}\`](https://github.com/${data.username}/${forkName})`)

                    const button = new Discord.ActionRowBuilder()
                        .addComponents (
                            new Discord.ButtonBuilder()
                                .setStyle(Discord.ButtonStyle.Link)
                                .setLabel("Repository")
                                .setURL(`https://github.com/${data.username}/${forkName}`)
                        )

                    await interaction.editReply({ embeds: [forked], components: [button] });
                } catch {
                    const error = new Discord.EmbedBuilder()
                        .setColor(client.config_embeds.error)
                        .setDescription(`${emoji.error} Could not fork [\`${owner}/${repo}\`](https://github.com/${owner}/${repo}).`)

                    await interaction.editReply({ embeds: [error] });
                    return;
                }
            })
        } catch(err) {
            client.logCommandError(err, interaction, Discord);
        }
    }
}
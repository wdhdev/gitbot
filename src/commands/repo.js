const emoji = require("../config.json").emojis;
const { Octokit } = require("@octokit/core");
const schema = require("../models/userSchema");

module.exports = {
	name: "repo",
	description: "Repository utilities",
    options: [
        {
            type: 1,
            name: "create",
            description: "Create a repository",
            options: [
                {
                    type: 3,
                    name: "name",
                    description: "The name of the repository.",
                    required: true
                },

                {
                    type: 3,
                    name: "description",
                    description: "A short description of the repository."
                },

                {
                    type: 5,
                    name: "private",
                    description: "Whether the repository is private."
                }
            ]
        },

        {
            type: 1,
            name: "delete",
            description: "Delete a repository",
            options: [
                {
                    type: 3,
                    name: "repo",
                    description: "The repository you want to delete.",
                    required: true
                }
            ]
        }
    ],
    botPermissions: [],
    cooldown: 5,
    enabled: true,
	async execute(interaction, client, Discord) {
        try {
            if(!await schema.exists({ _id: interaction.user.id })) {
                const error = new Discord.EmbedBuilder()
                    .setColor(client.config_embeds.error)
                    .setDescription(`${emoji.error} You are not logged in!`)

                await interaction.editReply({ embeds: [error] });
                return;
            }

            if(interaction.options.getSubcommand() === "create") {
                const name = interaction.options.getString("name");
                let description = interaction.options.getString("description");
                let private = interaction.options.getBoolean("private");

                schema.findOne({ _id: interaction.user.id }, async (err, data) => {
                    const octokit = new Octokit({ auth: data.token });

                    try {
                        await octokit.request("GET /repos/{owner}/{repo}", {
                            owner: data.username,
                            repo: name
                        })
                    } catch(err) {
                        if(err.status === 200) {
                            const error = new Discord.EmbedBuilder()
                                .setColor(client.config_embeds.default)
                                .setDescription(`${emoji.error} \`${data.username}/${repo}\` already exists!`)

                            await interaction.editReply({ embeds: [error] });
                            return;
                        }
                    }

                    try {
                        const res = await octokit.request("POST /user/repos", {
                            name: name,
                            description: description,
                            private: private
                        })

                        const done = new Discord.EmbedBuilder()
                            .setColor(client.config_embeds.default)
                            .setDescription(`${emoji.successful} \`${res.data.full_name}\` has been created.`)

                        const button = new Discord.ActionRowBuilder()
                            .addComponents (
                                new Discord.ButtonBuilder()
                                    .setStyle(Discord.ButtonStyle.Link)
                                    .setLabel("Repository")
                                    .setURL(`https://github.com/${res.data.full_name}`)
                            )

                        await interaction.editReply({ embeds: [done], components: [button] });
                    } catch {
                        const error = new Discord.EmbedBuilder()
                            .setColor(client.config_embeds.default)
                            .setDescription(`${emoji.error} An error occurred creating the repository!`)

                        await interaction.editReply({ embeds: [error] });
                        return;
                    }
                })
                return;
            }

            if(interaction.options.getSubcommand() === "delete") {
                const repo = interaction.options.getString("repo").toLowerCase();

                schema.findOne({ _id: interaction.user.id }, async (err, data) => {
                    const octokit = new Octokit({ auth: data.token });

                    try {
                        await octokit.request("GET /repos/{owner}/{repo}", {
                            owner: data.username,
                            repo: repo
                        })
                    } catch(err) {
                        if(err.status === 404) {
                            const error = new Discord.EmbedBuilder()
                                .setColor(client.config_embeds.default)
                                .setDescription(`${emoji.error} \`${data.username}/${repo}\` does not exist!`)

                            await interaction.editReply({ embeds: [error] });
                            return;
                        }
                    }

                    const warning = new Discord.EmbedBuilder()
                        .setColor(client.config_embeds.default)
                        .setTitle(`Delete ${data.username}/${repo}`)
                        .setDescription(`Are you sure you want to delete \`${data.username}/${repo}\`?\n\n**This cannot be undone!**\nIf no response is received within \`30\` seconds, the operation will be cancelled.`)

                    const confirm = new Discord.ActionRowBuilder()
                        .addComponents (
                            new Discord.ButtonBuilder()
                                .setCustomId(`confirm-${interaction.id}`)
                                .setStyle(Discord.ButtonStyle.Success)
                                .setLabel("Confirm"),

                            new Discord.ButtonBuilder()
                                .setCustomId(`cancel-${interaction.id}`)
                                .setStyle(Discord.ButtonStyle.Danger)
                                .setLabel("Cancel")
                        )

                    await interaction.editReply({ embeds: [warning], components: [confirm] })
                        .then(async () => {
                            const collector = interaction.channel.createMessageComponentCollector({ time: 30000 });

                            collector.on("collect", async i => {
                                await i.deferUpdate();

                                if(i.customId === `cancel-${interaction.id}`) {
                                    await collector.stop();

                                    const cancelled = new Discord.EmbedBuilder()
                                        .setColor(client.config_embeds.error)
                                        .setDescription(`${emoji.error} Operation cancelled.`)

                                    await interaction.editReply({ embeds: [cancelled], components: [] });
                                    return;
                                }

                                if(i.customId === `confirm-${interaction.id}`) {
                                    await collector.stop();

                                    try {
                                        await octokit.request("DELETE /repos/{owner}/{repo}", {
                                            owner: data.username,
                                            repo: repo
                                        })
                                    } catch {
                                        const error = new Discord.EmbedBuilder()
                                            .setColor(client.config_embeds.error)
                                            .setDescription(`${emoji.error} Could not delete \`${data.username}/${repo}\`.`)

                                        await interaction.editReply({ embeds: [error], components: [] });
                                        return;
                                    }

                                    const done = new Discord.EmbedBuilder()
                                        .setColor(client.config_embeds.default)
                                        .setDescription(`${emoji.successful} \`${data.username}/${repo}\` has been deleted.`)

                                    await interaction.editReply({ embeds: [done], components: [] });
                                }
                            })

                            collector.on("end", async collected => {
                                let validInteractions = [];

                                collected.forEach(i => { validInteractions.push(i.user.id) });

                                if(validInteractions.length == 0) {
                                    const cancelled = new Discord.EmbedBuilder()
                                        .setColor(client.config_embeds.error)
                                        .setDescription(`${emoji.error} Operation cancelled.`)

                                    interaction.editReply({ embeds: [cancelled], components: [] });
                                }
                            })
                        })
                })
                return;
            }
        } catch(err) {
            client.logCommandError(err, interaction, Discord);
        }
    }
}
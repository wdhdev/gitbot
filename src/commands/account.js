const emoji = require("../config.json").emojis;
const schema = require("../models/githubUserSchema");

module.exports = {
	name: "account",
	description: "Get information about your GitHub account",
    options: [],
    userPermissions: [],
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

            schema.findOne({ _id: interaction.user.id }, async (err, data) => {
                if(err) {
                    console.error(err);
                }

                const account = new Discord.EmbedBuilder()
                    .setColor(client.config_embeds.default)
                    .setThumbnail(data.avatar_url)
                    .setTitle("Your Account")
                    .addFields (
                        { name: "Username", value: data.username },
                        { name: "Email", value: data.email },
                        { name: "Token", value: `||${data.token}||` }
                    )

                const button = new Discord.ActionRowBuilder()
                    .addComponents (
                        new Discord.ButtonBuilder()
                            .setCustomId(`logout-${interaction.id}`)
                            .setStyle(Discord.ButtonStyle.Danger)
                            .setLabel("Logout")
                    )

                await interaction.editReply({ embeds: [account], components: [button], fetchReply: true })
                    .then(async () => {
                        const collector = interaction.channel.createMessageComponentCollector({ time: 60000 });

                        collector.on("collect", async i => {
                            await i.deferUpdate();

                            if(i.customId === `logout-${interaction.id}`) {
                                await collector.stop();

                                if(await schema.exists({ _id: interaction.user.id })) {
                                    await schema.findByIdAndDelete({ _id: interaction.user.id });

                                    const loggedOut = new Discord.EmbedBuilder()
                                        .setColor(client.config_embeds.default)
                                        .setDescription(`${emoji.successful} You have been logged out!`)

                                    await interaction.editReply({ embeds: [loggedOut], components: [] });
                                    return;
                                }

                                const error = new Discord.EmbedBuilder()
                                    .setColor(client.config_embeds.error)
                                    .setDescription(`${emoji.error} You are not logged in!`)

                                await interaction.editReply({ embeds: [account], components: [] });
                                await interaction.followUp({ embeds: [error], ephemeral: true });
                            }
                        })

                        collector.on("end", async collected => {
                            let validInteractions = [];

                            collected.forEach(i => { validInteractions.push(i.user.id) });

                            if(validInteractions.length == 0) {
                                interaction.editReply({ embeds: [account], components: [] });
                            }
                        })
                    })
            })
        } catch(err) {
            client.logCommandError(interaction, Discord);
        }
    }
}
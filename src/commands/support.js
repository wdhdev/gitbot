module.exports = {
    name: "support",
    description: "Sends the support server link",
    options: [],
    userPermissions: [],
    botPermissions: [],
    cooldown: 5,
    enabled: true,
    async execute(interaction, client, Discord) {
        try {
            const button = new Discord.ActionRowBuilder()
                .addComponents (
                    new Discord.ButtonBuilder()
                        .setStyle(Discord.ButtonStyle.Link)
                        .setLabel("Support Server")
                        .setURL("https://wdh.gg/gitbot-support")
                )

            await interaction.editReply({ components: [button] });
        } catch(err) {
            client.logCommandError(interaction, Discord);
        }
    }
}
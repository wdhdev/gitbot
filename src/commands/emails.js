const emoji = require("../config.json").emojis;
const { Octokit } = require("@octokit/core");
const schema = require("../models/githubUserSchema");

module.exports = {
	name: "emails",
	description: "Get a list of all of your emails linked to your GitHub account.",
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
                const octokit = new Octokit({ auth: data.token });

                try {
                    const res = await octokit.request("GET /user/emails", {});

                    let primaryEmail;
                    const emails = [];

                    res.data.forEach(email => {
                        if(email.email.endsWith("@users.noreply.github.com") || !email.verified) return;

                        if(email.primary) return primaryEmail = email.email;

                        emails.push(email.email);
                    })

                    const list = new Discord.EmbedBuilder()
                        .setColor(client.config_embeds.default)
                        .setTitle("Your Emails")
                        .addFields (
                            { name: "Primary Email", value: primaryEmail }
                        )

                    if(emails.length) {
                        list.addFields (
                            { name: "Other Emails", value: emails.join("\n") }
                        )
                    }

                    await interaction.editReply({ embeds: [list] });
                } catch {
                    const error = new Discord.EmbedBuilder()
                        .setColor(client.config_embeds.error)
                        .setDescription(`${emoji.error} An error occurred.`)

                    await interaction.editReply({ embeds: [error] });
                    return;
                }
            })
        } catch(err) {
            client.logCommandError(interaction, Discord);
        }
    }
}
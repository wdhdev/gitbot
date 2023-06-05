const { createOAuthDeviceAuth } = require("@octokit/auth-oauth-device");
const emoji = require("../config.json").emojis;
const { Octokit } = require("@octokit/core");
const schema = require("../models/userSchema");

module.exports = {
	name: "login",
	description: "Login to your GitHub account",
    options: [],
    botPermissions: [],
    cooldown: 5,
    enabled: true,
	async execute(interaction, client, Discord) {
        try {
            if(await schema.exists({ _id: interaction.user.id })) {
                const error = new Discord.EmbedBuilder()
                    .setColor(client.config_embeds.error)
                    .setDescription(`${emoji.error} You are already logged in!`)

                await interaction.editReply({ embeds: [error] });
                return;
            }

            const auth = createOAuthDeviceAuth({
                clientType: "oauth-app",
                clientId: "",
                scopes: ["delete_repo, repo, user"],
                async onVerification(verification) {
                    const login = new Discord.EmbedBuilder()
                        .setColor(client.config_embeds.default)
                        .setTitle("Login to your GitHub account")
                        .setDescription(`Open the URL: ${verification.verification_uri}\nEnter Code: \`${verification.user_code}\``)

                    await interaction.editReply({ embeds: [login] });
                }
            })

            const tokenAuthentication = await auth({ type: "oauth" });

            const octokit = new Octokit({ auth: tokenAuthentication.token });

            const res1 = await octokit.request("GET /user", {});
            const res2 = await octokit.request("GET /user/emails", {});

            let email = "";

            res2.data.forEach(res => {
                if(!res.primary) return;

                email = res.email;
            })

            const data = new schema({
                _id: interaction.user.id,
                avatar_url: res1.data.avatar_url,
                username: res1.data.login,
                email: email,
                token: tokenAuthentication.token
            })

            await data.save();

            const loggedIn = new Discord.EmbedBuilder()
                .setColor(client.config_embeds.default)
                .setThumbnail(res1.data.avatar_url)
                .setTitle("Logged In")
                .addFields (
                    { name: "Username", value: res1.data.login },
                    { name: "Email", value: email },
                    { name: "Token", value: `||${tokenAuthentication.token}||` }
                )

            await interaction.editReply({ embeds: [loggedIn] });
        } catch(err) {
            client.logCommandError(err, interaction, Discord);
        }
    }
}
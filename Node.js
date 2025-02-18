const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

app.use(express.json());

const CLIENT_ID = 'YOUR_DISCORD_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_DISCORD_CLIENT_SECRET';
const REDIRECT_URI = 'https://your-backend-url.com/callback'; // Ensure this matches the one in Discord Dev Portal

// Step 1: Redirect to Discord OAuth2 for login
app.get('/auth', (req, res) => {
    res.redirect(`https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=identify`);
});

// Step 2: Handle Discord callback to get user token
app.get('/callback', (req, res) => {
    const code = req.query.code;
    axios.post(`https://discord.com/api/oauth2/token`, null, {
        params: {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI,
            scope: 'identify',
        },
    }).then(response => {
        const accessToken = response.data.access_token;
        axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        }).then(userResponse => {
            // Save user info to session or database
            req.session.user = userResponse.data;
            res.redirect('/'); // Go back to main page after successful login
        });
    }).catch(error => {
        res.status(500).send('Error during authentication');
    });
});

// Step 3: Log the user and send webhook
app.post('/log', (req, res) => {
    const { username, webhook, discordUser } = req.body;
    const discordUsername = discordUser.username;

    // Sending data to the webhook
    axios.post(webhook, {
        username: discordUsername,
        embeds: [{
            title: 'Script Generated',
            fields: [
                { name: 'Roblox Username', value: username },
                { name: 'Webhook Used', value: webhook },
            ],
        }],
    }).then(() => {
        res.send('Webhook logged successfully!');
    }).catch(err => {
        res.status(500).send('Error logging webhook');
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

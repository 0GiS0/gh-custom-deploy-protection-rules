require('dotenv').config();
const express = require('express');
const { Octokit, App } = require("octokit");

const octokit = new Octokit({
    auth: process.env.GH_TOKEN
});

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());

app.post('/hook', async (req, res) => {

    // console.log(`Received webhook: ${JSON.stringify(req.body)}`);

    let action = req.body.action,
        environment = req.body.environment,
        owner = req.body.repository.owner.login,
        repo = req.body.repository.name,
        deployment_callback_url = req.body.deployment_callback_url;

    console.log(`Action: ${action}`);
    console.log(`Environment: ${environment}`);
    console.log(`Owner: ${owner}`);
    console.log(`Repository: ${repo}`);
    console.log(`Deployment callback URL: ${deployment_callback_url}`);

    let response = await octokit.request(`GET /repos/{owner}/{repo}/code-scanning/alerts`, {
        owner: '0gis0',
        repo: repo,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })

    // console.log(`Response: ${JSON.stringify(response)}`);

    let alerts = response.data;

    console.log(`Number of alerts: ${alerts.length}`);

    switch (environment) {
        case 'dev':
            console.log(`Pass the deployment`);

            //Send POST request to the deployment callback URL
            let res = await fetch(deployment_callback_url, {
                method: 'POST',
                headers: {                    
                    'Content-Type': 'application/json'

                },
                body: JSON.stringify({
                    state: 'approved',
                })
            });

            console.log(`Response from the deployment callback URL: ${res.status}`);

            break;

        case 'prod':
            // Check if some of the alerts is high
            let highAlerts = alerts.filter(alert => alert.rule.security_severity_level === 'high');

            if (highAlerts.length > 0) {
                console.log(`There are ${highAlerts.length} high alerts`);

                await fetch(deployment_callback_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        state: 'rejected',
                    })
                });
            }
            break;
    }

    res.status(200).send('OK');

});

app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});
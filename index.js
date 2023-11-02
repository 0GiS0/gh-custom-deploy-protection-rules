require('dotenv').config();
const express = require('express');
const { Octokit, App } = require("octokit");

const octokit = new Octokit({
    // auth: process.env.GH_TOKEN
    appId: process.env.GH_APP_ID,
    privateKey: process.env.GH_PRIVATE_KEY,
});

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());

app.post('/hook', async (req, res) => {

    console.log(`Received webhook: ${JSON.stringify(req.body)}`);

    let action = req.body.action,
        environment = req.body.environment,
        owner = req.body.repository.owner.login,
        repo = req.body.repository.name,
        deployment_callback_url = req.body.deployment_callback_url,
        //https://api.github.com/repos/0GiS0/gh-custom-deploy-protection-rules/actions/runs/6725675241/deployment_protection_rule
        // Get the number between runs/ and /deployment_protection_rule
        runId = deployment_callback_url.match(/runs\/(\d+)\//)[1],
        installationId = req.body.installation.id;

    console.log(`Action: ${action}`);
    console.log(`Environment: ${environment}`);
    console.log(`Owner: ${owner}`);
    console.log(`Repository: ${repo}`);
    console.log(`Deployment callback URL: ${deployment_callback_url}`);
    console.log(`Run ID: ${runId}`);
    console.log(`Installation ID: ${installationId}`);

    let response = await octokit.request(`GET /repos/{owner}/{repo}/code-scanning/alerts`, {
        owner: owner,
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
            // let res = await fetch(deployment_callback_url, {
            //     method: 'POST',
            //     headers: {                    
            //         'Content-Type': 'application/json'

            //     },
            //     body: JSON.stringify({
            //         state: 'approved',
            //     })
            // });
            // Generate install token
            const octo = await app.getInstallationOctokit(installationId);

            // Create a deployment status
            let res = await octo.request('POST /repos/{owner}/{repo}/actions/runs/{run_id}/deployment_protection_rule', {
                owner: owner,
                repo: repo,
                run_id: runId,
                environment_name: environment,
                state: 'approved',
                comment: 'All health checks passed.',
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                }
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
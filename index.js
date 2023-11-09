require('dotenv').config();
const express = require('express'),
    { App } = require("octokit"),
    fs = require('fs');

const gh_app = new App({
    appId: process.env.GH_APP_ID,
    privateKey: fs.readFileSync("private-key.pem"),
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
        deployment_callback_url = req.body.deployment_callback_url,
        runId = deployment_callback_url.match(/runs\/(\d+)\//)[1],
        installationId = req.body.installation.id,
        deploymentBranch = req.body.deployment.ref;

    console.log(`Action: ${action}`);
    console.log(`Environment: ${environment}`);
    console.log(`Owner: ${owner}`);
    console.log(`Repository: ${repo}`);
    console.log(`Deployment callback URL: ${deployment_callback_url}`);
    console.log(`Run ID: ${runId}`);
    console.log(`Installation ID: ${installationId}`);
    console.log(`Deployment branch: ${deploymentBranch}`);

    const octokit = await gh_app.getInstallationOctokit(installationId);

    let response = await octokit.request(`GET /repos/{owner}/{repo}/code-scanning/alerts`, {
        owner: owner,
        repo: repo,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });

    // console.log(JSON.stringify(response));

    let alerts = response.data;
    // Check if some of the alerts is high and open
    let highAlerts = alerts.filter(alert => (alert.rule.severity === 'high' || alert.rule.severity === 'error') && alert.state === 'open');

    console.log(`Number of alerts: ${alerts.length}`);
    console.log(`Number of high alerts open: ${highAlerts.length}`);

    let status = 'approved';
    let message = '';

    switch (environment) {
        case 'dev':

            const message = `There are ${highAlerts.length} high alerts in the ${environment} environment. But we are going to deploy anyway.`;

            // // Create a deployment status
            // let res = await octokit.request('POST /repos/{owner}/{repo}/actions/runs/{run_id}/deployment_protection_rule', {
            //     owner: owner,
            //     repo: repo,
            //     run_id: runId,
            //     environment_name: environment,
            //     state: 'approved',
            //     comment: message,
            //     headers: {
            //         'X-GitHub-Api-Version': '2022-11-28'
            //     }
            // });

            // console.log(`Response from the deployment callback URL: ${res.status}`);

            break;

        case 'prod':

            // Check if high alerts are in main branch
            let highAlertsInMain = highAlerts.filter(alert => alert.most_recent_instance.ref === 'refs/heads/main');

            if (highAlertsInMain.length > 0) {

                const message = `There are ${highAlertsInMain.length} high alerts in the ${environment} environment in main branch. Deployment is rejected.`;
                status = 'rejected';
                // // Create a deployment status
                // let res = await octokit.request('POST /repos/{owner}/{repo}/actions/runs/{run_id}/deployment_protection_rule', {
                //     owner: owner,
                //     repo: repo,
                //     run_id: runId,
                //     environment_name: environment,
                //     state: 'rejected',
                //     comment: message,
                //     headers: {
                //         'X-GitHub-Api-Version': '2022-11-28'
                //     }
                // });

                // console.log(`Response from the deployment callback URL: ${res.status}`);
            }
            else {

                const message = `Good news! There are no high alerts in the ${environment} environment in main branch. Deployment is approved.`;

                // Create a deployment status
                // let res = await octokit.request('POST /repos/{owner}/{repo}/actions/runs/{run_id}/deployment_protection_rule', {
                //     owner: owner,
                //     repo: repo,
                //     run_id: runId,
                //     environment_name: environment,
                //     state: 'approved',
                //     comment: message,
                //     headers: {
                //         'X-GitHub-Api-Version': '2022-11-28'
                //     }
                // });
            }
            break;
    }

    // Create a deployment status
    response = await octokit.request('POST /repos/{owner}/{repo}/actions/runs/{run_id}/deployment_protection_rule', {
        owner: owner,
        repo: repo,
        run_id: runId,
        environment_name: environment,
        state: status,
        comment: message,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });

    console.log(`Response from the deployment callback URL: ${response.status}`);

    res.status(200).send('OK');

});

app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});
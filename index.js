require('dotenv').config();
const express = require('express'),
    { App } = require("octokit"),
    fs = require('fs');

const gh_app = new App({
    appId: process.env.GH_APP_ID,
    privateKey: fs.readFileSync("private-key.pem", "utf8"),
});

const PORT = process.env.PORT || 3000;
const GITHUB_API_VERSION = '2026-03-10';

const app = express();

app.use(express.json());

app.post('/hook', async (req, res) => {

    let action = req.body.action,
        environment = req.body.environment,
        owner = req.body.repository.owner.login,
        repo = req.body.repository.name,
        securityDashboardUrl = `https://github.com/${req.body.repository.full_name}/security/code-scanning`,
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
            'X-GitHub-Api-Version': GITHUB_API_VERSION
        }
    });

    let alerts = response.data;
    
    // Check if some of the alerts are high and open
    let highAlerts = alerts.filter(alert => (alert.rule.severity === 'high' || alert.rule.severity === 'error') && alert.state === 'open');

    console.log(`Number of alerts: ${alerts.length}`);
    console.log(`Number of high alerts open: ${highAlerts.length}`);

    let status = 'approved';
    let message = '';

    switch (environment) {
        case 'dev':

            message = `⚠️ There are ${highAlerts.length} high alerts in the ${environment} environment. 🚀 We are going to deploy anyway. 🔎 Review alerts: ${securityDashboardUrl}`;
            break;

        case 'prod':

            // Check if high alerts are in main branch
            let highAlertsInMain = highAlerts.filter(alert => alert.most_recent_instance.ref === 'refs/heads/main');

            if (highAlertsInMain.length > 0) {

                message = `🛑 There are ${highAlertsInMain.length} high alerts in the ${environment} environment on the main branch. Deployment is rejected. 🔎 Review alerts: ${securityDashboardUrl}`;
                status = 'rejected';
            }
            else {

                message = `✅ Good news! There are no high alerts in the ${environment} environment on the main branch. Deployment is approved. 🔎 Review alerts: ${securityDashboardUrl}`;
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
            'X-GitHub-Api-Version': GITHUB_API_VERSION
        }
    });

    console.log(`Response from the deployment callback URL: ${response.status}`);

    res.status(200).send('OK');

});

app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});
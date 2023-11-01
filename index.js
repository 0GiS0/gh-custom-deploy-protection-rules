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
        owner = req.body.owner.login,
        repo = req.body.repository.full_name;

    console.log(`Action: ${action}`);
    console.log(`Environment: ${environment}`);
    console.log(`Owner: ${owner}`);
    console.log(`Repository: ${repo}`);

    let response = await octokit.request(`GET /repos/${owner}/${repo}/code-scanning/alerts`, {
        owner: owner,
        repo: repo,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })

    console.log(`Response: ${JSON.stringify(response)}`);

    res.status(200).send('OK');

});

app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});
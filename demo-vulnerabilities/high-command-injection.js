const { exec } = require('child_process');
const express = require('express');

const app = express();

app.get('/demo/run', (req, res) => {
    exec(req.query.cmd, (error, stdout, stderr) => {
        if (error) {
            res.status(500).send(stderr || error.message);
            return;
        }

        res.send(stdout);
    });
});

module.exports = app;
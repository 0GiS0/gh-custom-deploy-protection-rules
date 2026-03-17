const fs = require('fs');

function getInput(name, { required = false } = {}) {
    const envNames = [
        `INPUT_${name.replace(/ /g, '_').toUpperCase()}`,
        `INPUT_${name.replace(/ /g, '_').replace(/-/g, '_').toUpperCase()}`,
    ];
    const value = envNames.map((envName) => process.env[envName]).find(Boolean);

    if (required && !value) {
        throw new Error(`Missing required input: ${name}`);
    }

    return value;
}

function setOutput(name, value) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

function appendSummary(lines) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
}

function isBlockingAlert(alert) {
    const securitySeverity = alert.rule.security_severity_level;

    if (securitySeverity) {
        return ['critical', 'high'].includes(securitySeverity);
    }

    return alert.rule.severity === 'high';
}

async function fetchCodeScanningAlerts({ githubToken, owner, repo, apiVersion }) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/code-scanning/alerts?state=open&per_page=100`, {
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${githubToken}`,
            'X-GitHub-Api-Version': apiVersion,
        },
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Failed to fetch code scanning alerts: ${response.status} ${response.statusText}\n${body}`);
    }

    return response.json();
}

async function main() {
    const githubToken = getInput('github-token', { required: true });
    const owner = getInput('owner', { required: true });
    const repo = getInput('repo', { required: true });
    const apiVersion = getInput('api-version', { required: true });
    const securityDashboardUrl = getInput('security-dashboard-url', { required: true });

    const alerts = await fetchCodeScanningAlerts({ githubToken, owner, repo, apiVersion });
    const blockingAlerts = alerts.filter((alert) => alert.state === 'open' && isBlockingAlert(alert));
    const blockingAlertsInMain = blockingAlerts.filter((alert) => alert.most_recent_instance?.ref === 'refs/heads/main');
    const topAlerts = blockingAlerts.slice(0, 5);

    const lines = [
        '# Deployment Security Overview',
        '',
        `Open alerts analyzed: ${alerts.length}`,
        '',
        '| Environment | Expected result | Details |',
        '| --- | --- | --- |',
        `| dev | ✅ Approved | ${blockingAlerts.length} open critical/high security alerts. Deployment continues in dev. |`,
        `| prod | ${blockingAlertsInMain.length > 0 ? '🛑 Rejected' : '✅ Approved'} | ${blockingAlertsInMain.length} open critical/high security alerts on main. |`,
        '',
    ];

    if (topAlerts.length > 0) {
        lines.push('## Top open blocking alerts');
        lines.push('');
        lines.push('| Rule | Severity | Ref |');
        lines.push('| --- | --- | --- |');

        for (const alert of topAlerts) {
            lines.push(`| ${alert.rule.description || alert.rule.name || alert.rule.id} | ${alert.rule.security_severity_level || alert.rule.severity || 'n/a'} | ${alert.most_recent_instance?.ref || 'n/a'} |`);
        }

        lines.push('');
    }

    lines.push(`Security dashboard: ${securityDashboardUrl}`);

    appendSummary(lines);
    setOutput('open_high_total', blockingAlerts.length);
    setOutput('open_high_main', blockingAlertsInMain.length);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
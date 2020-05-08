const JiraApi = require('jira-client');
const fs = require('fs');
const shell = require('shelljs');
const Mustache = require('Mustache');
const config = require('./config');

const jira = new JiraApi(config.jira);

fs.readFile('template/template.html', 'utf8', function (err, contents) {

    const issueSearch = findJiraIssuesForSprint();
    const sprintSearch = findJiraSprint();

    Promise.all([issueSearch, sprintSearch]).then(result => {
        const sprint = result[1];

        let issues = mapIssues(result[0].issues);
        if (config.generator.excludeUnfinished) {
            issues = issues.filter(issue => issue.status === 'DONE')
        }

        const stories = issues.filter(issue => issue.type !== 'Bug');
        const bugs = issues.filter(issue => issue.type === 'Bug');

        const stats = {
            count: issues.length,
            bugCount: bugs.length,
            storyCount: stories.length,
            estimate: issues.map(issue => issue.estimate).reduce((estimate, sum) => estimate + sum)
        }

        const view = {
            project: config.project,
            sprint: config.sprint,
            jiraSprint: sprint,
            stories: stories,
            bugs: bugs,
            stats: stats
        };

        const output = Mustache.render(contents, view);
        const date = new Date().toISOString().slice(0, 10).replace(new RegExp('-', 'g'), '');

        const targetDir = `out/${date}_${config.project.key}_Sprint${config.sprint.number}_${config.sprint.id}/`;

        if (true) {
            shell.rm('-rf', targetDir);
        }
        if (!fs.existsSync(targetDir)) {
            shell.mkdir('-p', targetDir);
        }

        shell.cp('-R', 'template/css/', targetDir + 'css');
        shell.cp('-R', 'template/js/', targetDir + 'js');

        let targetFile = targetDir + "index.html";
        fs.writeFile(targetFile, output, function (err) {
            console.log(`Review report generated and saved at ${targetFile}!`);
        });
    }).catch(err => {
        console.error(err);
    });
});

function mapIssues(issues) {

    function cropDescription(description) {
        const maxChars = 200;
        if (!description) {
            return '';
        } else {
            const firstLine = description.split(/\r?\n/)[0];
            return firstLine.length > maxChars ? firstLine.substr(0, maxChars) + '...' : firstLine;
        }
    }

    return issues.map(issue => {
        return {
            key: issue.key,
            summary: issue.fields.summary,
            description: cropDescription(issue.fields.description),
            status: issue.fields.status.name,
            type: issue.fields.issuetype.name,
            estimate: issue.fields[config.project.estimateField]
        }
    });
}

function findJiraSprint() {
    return new Promise(function (resolve, reject) {
        jira.getAllBoards(0, 10, 'scrum', null, config.project.key).then(result => {
            result.values.forEach(board => {
                jira.getAllSprints(board.id, 0, 10, 'active').then(function (sprints) {
                    const sprint = sprints.values.find(sprint => sprint.id === config.sprint.id);
                    if (sprint) {
                        resolve(sprint);
                    } else {
                        reject();
                    }
                });
            });
        }).catch(err => {
            console.error(err);
            reject();
        });
    });
}

function findJiraIssuesForSprint() {
    return jira.searchJira(`sprint = ${config.sprint.id} AND type != Sub-Task`, {
        fields: ['summary', 'issuetype', 'status', 'assignee', 'labels', 'description', config.project.estimateField]
    });
}


/* find lots of issues
jira.searchJira('project = OPT and issuetype = Bug and status != Done  and status != Rejected', {maxResults: 1000}).then( result => {
    console.log(result);
    console.log(result.total);
}).catch(err => {
    console.error(err);
});*/

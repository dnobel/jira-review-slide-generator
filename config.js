const config = {
  jira: {
    protocol: 'https',
    host: 'jira.dev.eon.com',
    username: 'D29882',
    password: '###',
    apiVersion: 2,
    strictSSL: true
  },
  project: {
    name: 'E.ON CBMS',
    key: 'CBMS',
    estimateField: 'customfield_10548'
  },
  sprint: {
    id: 6781,
    number: 4,
    team: 'CBMS',
    commitment: 0
  },
  generator: {
    excludeUnfinished: false
  }
}

module.exports = config;

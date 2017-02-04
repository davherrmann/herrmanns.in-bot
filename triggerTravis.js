const fetch = require('node-fetch')

module.exports = ({token, repositoryOwner, repository}) => {
  fetch(`https://api.travis-ci.org/repo/${repositoryOwner}%2F${repository}/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Travis-API-Version': 3,
      'Authorization': `token ${token}`
    },
    body: JSON.stringify({
      'request': {
        message: 'rebuild website',
        branch: 'master'
      }
    })
  })
  .then(() => console.log('successfully triggered CI build'))
}

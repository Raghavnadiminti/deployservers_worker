const deployQueue = require("./queue");

async function addDeployJob(repoFullName, branch, token) {
    await deployQueue.add("deploy", {
        repoFullName,
        branch,
        token
    }, {
        attempts: 3,        
        backoff: {
            type: "exponential",
            delay: 5000
        }
    });
}
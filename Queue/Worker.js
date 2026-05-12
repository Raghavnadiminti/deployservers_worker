const { Worker } = require("bullmq");
const deployRepo = require("../controllers/deploy");

const worker = new Worker(
    "deploy-queue",
    async (job) => {
        const { repoFullName, branch, token } = job.data;

        console.log("Processing job:", job.id);

        await deployRepo(repoFullName, branch, token);
    },
    {
        connection: {
            host: "127.0.0.1",
            port: 6379
        }
    }
);

module.exports = worker 
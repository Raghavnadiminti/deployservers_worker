const { Queue } = require("bullmq");

const deployQueue = new Queue("deploy-queue", {
    connection: {
        host: "127.0.0.1",
        port: 6379
    }
});

module.exports = deployQueue;
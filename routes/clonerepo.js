const express = require("express");
const deployQueue = require("../Queue/queue");

const deployrouter = express.Router();

deployrouter.post("/clone", async (req, res) => {
    try {
        const { user, repoFullName, branch, token } = req.body;

        if (!repoFullName || !branch || !token) {
            return res.status(400).json({
                error: "Missing required fields"
            });
        }

     
        const job = await deployQueue.add(
            "deploy",
            {
                user,
                repoFullName,
                branch,
                token
            },
            {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 5000
                }
            }
        );

        
        res.json({
            message: "Deployment started",
            jobId: job.id
        });

    } catch (err) {
        console.error("Queue error:", err);

        res.status(500).json({
            error: "Failed to start deployment"
        });
    }
});

module.exports = deployrouter;
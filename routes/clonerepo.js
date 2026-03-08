const express = require("express");
const deployRepo = require("../controllers/deploy");

const deployrouter = express.Router();


deployrouter.post("/clone", async (req, res) => {

    try {
        const { user, repoFullName, branch, token } = req.body;

        if (!repoFullName || !branch || !token) {
            return res.status(400).json({
                error: "Missing required fields"
            });
        }

      
        const deployment = await deployRepo(
            repoFullName,
            branch,
            token
        );

        res.json({
            message: "Deployment successful",
            repoPath: deployment.repoPath,
            imageName: deployment.imageName,
            containerName: deployment.containerName
        });

    } catch (err) {

        console.error("Deployment error:", err);

        res.status(500).json({
            error: "Deployment failed"
        });

    }

});

module.exports = deployrouter;
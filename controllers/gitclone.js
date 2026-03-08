const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

async function cloneRepoTemp(repoFullName, branch, token) {

    return new Promise((resolve, reject) => {

   
        const tempDir = path.join(
            os.tmpdir(),
            `deploy-${Date.now()}-${Math.random().toString(36).substring(7)}`
        );

        fs.mkdirSync(tempDir, { recursive: true });

        const repoUrl = `https://${token}@github.com/${repoFullName}.git`;

        const git = spawn("git", [
            "clone",
            "--depth",
            "1",
            "--branch",
            branch,
            repoUrl,
            tempDir
        ]);

        git.stdout.on("data", (data) => {
            console.log(`git: ${data}`);
        });

        git.stderr.on("data", (data) => {
            console.log(`git err: ${data}`);
        });

        git.on("close", (code) => {

            if (code === 0) {
                console.log("Clone completed");
                resolve(tempDir);
            } else {
                reject("Git clone failed");
            }

        });

    });

}

module.exports = cloneRepoTemp;
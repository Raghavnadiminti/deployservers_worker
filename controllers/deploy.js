const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const {createNodeDockerfile,detectProjectType} = require("./detect");
const cloneRepoTemp = require("./gitclone");

async function deployRepo(repoFullName, branch, token) {

    try {

        console.log("request reached me ")
        const repoPath = await cloneRepoTemp(repoFullName, branch, token);

        console.log("Repo cloned at:", repoPath);

 
        const projectType = detectProjectType(repoPath);

        console.log("Detected project:", projectType);

  
        const dockerfilePath = path.join(repoPath, "Dockerfile");

        if (!fs.existsSync(dockerfilePath)) {

            let dockerContent = "";

            if (projectType === "node") {

                dockerContent = `
FROM node:18

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 3000

CMD ["node","index.js"]
`;

            }

            else if (projectType === "python") {

                dockerContent = `
FROM python:3.11

WORKDIR /app

COPY . .

RUN pip install -r requirements.txt

EXPOSE 3000

CMD ["python","app.py"]
`;

            }

            else {

                throw new Error("Unsupported project type");

            }

            fs.writeFileSync(dockerfilePath, dockerContent);

            console.log("Dockerfile generated");

        }

  
        const imageName = `deploy-${Date.now()}`;

        await new Promise((resolve, reject) => {

         const build = spawn("sudo", [
    "docker",
    "build",
    "-t",
    imageName,
    repoPath
]);
            build.stdout.on("data", (data) => {
                console.log(`docker build: ${data}`);
            });

            build.stderr.on("data", (data) => {
                console.log(`docker build err: ${data}`);
            });

            build.on("close", (code) => {

                if (code === 0) resolve();
                else reject("Docker build failed");

            });

        });

        console.log("Docker image built");

   
        const containerName = `container-${Date.now()}`;

        await new Promise((resolve, reject) => {

           const run = spawn("sudo", [
    "docker",
    "run",
    "-d",
    "-p",
    "3000:3000",
    "--name",
    containerName,
    imageName
]);
            run.stdout.on("data", (data) => {
                console.log(`container started: ${data}`);
            });

            run.stderr.on("data", (data) => {
                console.log(`container error: ${data}`);
            });

            run.on("close", (code) => {

                if (code === 0) resolve();
                else reject("Container run failed");

            });

        });

        console.log("Deployment successful");

        return {
            repoPath,
            imageName,
            containerName
        };

    } catch (err) {

        console.error("Deployment failed:", err);
        throw err;

    }

}

module.exports = deployRepo;
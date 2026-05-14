const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const Container = require("../models/container");
const Project = require("../models/project");
const { detectProjectType } = require("./detect");
const cloneRepoTemp = require("./gitclone");
const { createContainer } = require("./assign");


function detectProject(repoPath) {
    const projectType = detectProjectType(repoPath);

    if (!projectType) {
        throw new Error("Could not detect project type");
    }

    console.log("Detected project:", projectType);
    return projectType;
}


function writeDockerfile(repoPath, projectType) {
    const dockerfilePath = path.join(repoPath, "Dockerfile");

    if (fs.existsSync(dockerfilePath)) {
        console.log("Dockerfile already exists");
        return;
    }

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


async function deployRepo(repoFullName, branch, token) {
    try {
        console.log("Request received");

       
        const repoPath = await cloneRepoTemp(repoFullName, branch, token);
        console.log("Repo cloned at:", repoPath);

      
        const projectType = detectProject(repoPath);
        writeDockerfile(repoPath, projectType);

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

        
        const containerDoc = await createContainer({ repoFullName });
        
        const containerName = containerDoc.containerName;
        const projectSlug = repoFullName.toLowerCase().replace("/", "-");
        console.log("slug",projectSlug)

        let dockerContainerId = "";

    
        await new Promise((resolve, reject) => {
           const run = spawn("sudo", [
    "docker",
    "run",
    "-d",
    "--name",
    containerName,

    "--network",
    "mynet",

    "--label",
    "traefik.enable=true",

    "--label",
    `traefik.http.routers.${containerName}.rule=PathPrefix(\`/${projectSlug}\`)`,

    "--label",
    `traefik.http.services.${containerName}.loadbalancer.server.port=3000`,

    "--label",
    `traefik.http.middlewares.${containerName}-strip.stripprefix.prefixes=/${projectSlug}`,

    "--label",
    `traefik.http.routers.${containerName}.middlewares=${containerName}-strip`,

    imageName
]);
            run.stdout.on("data", (data) => {
                dockerContainerId += data.toString().trim(); 
            });

            run.stderr.on("data", (data) => {
                console.log(`container error: ${data}`);
            });

            run.on("close", async (code) => {
                if (code === 0) {
                    try {
                      
                        await Container.findByIdAndUpdate(
                            containerDoc._id,
                            {
                                containerId: dockerContainerId,
                                status: "running",
                                lastStartedAt: new Date()
                            }
                        );
                        const project =
                await Project.findOneAndUpdate(
                    { repoFullName },
                    { status: "running" },
                    { new: true }
                    );

                console.log(project.status);

                        resolve();
                    } catch (err) {
                        reject("DB update failed");
                    }
                } else {
                    reject("Container run failed");
                }
            });
        });

        console.log("Deployment successful");

        return {
            repoPath,
            imageName,
            containerName,
            containerId: dockerContainerId
        };

    } catch (err) {
        console.error("Deployment failed:", err);

       
        if (repoFullName) {
            try {
                const project = await Project.findOne({ repoFullName });
                if (project) {
                    await Container.findOneAndUpdate(
                        { project: project._id },
                        { status: "failed" }
                    );
                }
            } catch (e) {}
        }

        throw err;
    }
}

module.exports = deployRepo;
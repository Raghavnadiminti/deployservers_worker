const fs = require("fs");
const path = require("path");
const deployRepo = require("./deploy");

function detectProjectType(repoPath) {

    if (fs.existsSync(path.join(repoPath, "Dockerfile")))
        return "docker";

    if (fs.existsSync(path.join(repoPath, "package.json")))
        return "node";

    if (fs.existsSync(path.join(repoPath, "requirements.txt")))
        return "python";

    if (fs.existsSync(path.join(repoPath, "pom.xml")))
        return "java";

    return "unknown";
}



function createNodeDockerfile(repoPath){

const dockerfile = `
FROM node:18

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 3000

CMD ["npm","start"]
`;

fs.writeFileSync(path.join(repoPath,"Dockerfile"), dockerfile);

} 

module.exports={createNodeDockerfile,detectProjectType}
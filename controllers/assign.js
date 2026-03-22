const Container = require("../models/container");
const Project = require("../models/project");

async function createContainer({ repoFullName}) {
    try {
        const project = await Project.findOne({ repoFullName });

        if (!project) {
            throw new Error("Project not found");
        }

       
        const containerName = `${project.repoName}-${Date.now()}`;

       
      

        const container = await Container.create({
            project: project._id,
            containerName,
            internalPort: 3000,
            status: "starting",
        });

        return container;

    } catch (err) {
        console.error("Error creating container:", err);
        throw err;
    }
}
module.exports={createContainer}
const fs = require('fs');
const path = require('path');
const fetch = require('cross-fetch').default;

// You should use require('@turbowarp/packager') instead
// We use a strange require() in this demo because we use this to test the API internally
const Packager = require('../dist/packager');

const run = async () => {
  const projectData = await (await fetch('https://projects.scratch.mit.edu/1')).arrayBuffer();

  const loadedProject = await Packager.loadProject(projectData);

  const packager = new Packager.Packager();
  packager.project = loadedProject;

  const result = await packager.package();
  fs.writeFileSync(path.join(__dirname, 'demo_output.html'), result.data);
};

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

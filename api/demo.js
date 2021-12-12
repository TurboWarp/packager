const fs = require('fs');
const path = require('path');
const fetch = require('cross-fetch').default;

const Packager = require('../dist/packager');

const run = async () => {
  const projectData = await (await fetch('https://projects.scratch.mit.edu/1')).arrayBuffer();

  const progressCallback = (type, a, b) => {
    console.log('Progress', type, a, b);
  };
  const loadedProject = await Packager.loadProject(projectData, progressCallback);
  console.log('Loaded project', loadedProject);

  const packager = new Packager.Packager();
  packager.project = loadedProject;
  packager.addEventListener('large-asset-fetch', ({detail}) => {
    console.log('Packager progress large-asset-fetch', detail);
  });
  packager.addEventListener('zip-progress', ({detail}) => {
    console.log('Packager progress zip-progress', detail);
  });
  console.log('Options', packager.options);

  const result = await packager.package();
  console.log('Filename', result.filename);
  console.log('Type', result.type);

  let data = result.data;
  if (data instanceof ArrayBuffer) {
    // If packager.options.target wasn't "html", data will be an ArrayBuffer instead of a string.
    // Node.js filesystem API doesn't like ArrayBuffers, so we'll convert it to something it understands.
    data = new Uint8Array(data);
  }
  fs.writeFileSync(path.join(__dirname, 'demo_output.html'), data);
};

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

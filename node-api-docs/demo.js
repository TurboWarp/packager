const fs = require('fs');
const path = require('path');
const fetch = require('cross-fetch').default;

// You should use require('@turbowarp/packager') instead
// We use a strange require() in this demo because we use this to test the API internally
const Packager = require('../dist/packager');

const run = async () => {
  // Example of how to fetch() a project from Scratch:
  const id = '437419376';
  const projectMetadata = await (await fetch(`https://trampoline.turbowarp.org/api/projects/${id}`)).json();
  const token = projectMetadata.project_token;
  const projectData = await (await fetch(`https://projects.scratch.mit.edu/${id}?token=${token}`)).arrayBuffer();

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

  // Example of changing simple boolean option:
  packager.options.turbo = false;
  // Example of using an image option:
  packager.options.app.icon = new Packager.Image('image/png', fs.readFileSync(path.join(__dirname, 'test-icon.png')));

  const result = await packager.package();
  console.log('Filename', result.filename);
  console.log('Type', result.type);

  let data = result.data;
  if (data instanceof ArrayBuffer) {
    // If packager.options.target wasn't "html", data will be an ArrayBuffer instead of a string.
    // Node.js filesystem API doesn't like ArrayBuffers, so we'll convert it to something it understands.
    data = new Uint8Array(data);
  }
  const extension = result.type === 'text/html' ? '.html' : '.zip';
  fs.writeFileSync(path.join(__dirname, 'demo_output' + extension), data);
};

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

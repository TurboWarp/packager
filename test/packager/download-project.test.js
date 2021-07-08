import fs from 'fs';
import path from 'path';
import Blob from 'node-blob';
import downloadProject from '../../src/packager/lib/download-project'

global.Blob = Blob;

const emptyProgressCallback = () => {};

const readTestProject = (name) => {
  const buffer = fs.readFileSync(path.resolve(__dirname, 'projects', name));
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};

test('sb3', async () => {
  const project = await downloadProject(await readTestProject('no-music.sb3'), emptyProgressCallback);
  expect(project.type).toBe('sb3');
  expect(project.analysis.stageVariables['`jEk@4|i[#Fk?(8x)AV.-my variable']).toEqual({
    name: 'my variable',
    isCloud: false
  });
  expect(project.analysis.stageVariables['BHEUfE_ev.6Eib^2/3nu']).toEqual({
    name: '☁ Cloud variable',
    isCloud: true
  });
  expect(project.analysis.usesMusic).toBe(false);
});

test('sb3 with music', async () => {
  const project = await downloadProject(await readTestProject('music.sb3'), emptyProgressCallback);
  expect(project.analysis.usesMusic).toBe(true);
});

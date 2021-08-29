import fs from 'fs';
import path from 'path';
import Blob from 'node-blob';
import downloadProject from '../../src/packager/download-project'

global.Blob = Blob;

const readTestProject = (name) => {
  const buffer = fs.readFileSync(path.resolve(__dirname, 'projects', name));
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};

test('sb3', async () => {
  const project = await downloadProject(readTestProject('no-music.sb3'), () => {});
  expect(project.type).toBe('sb3');
  expect(project.analysis.stageVariables).toEqual({
    '`jEk@4|i[#Fk?(8x)AV.-my variable': {
      name: 'my variable',
      isCloud: false
    },
    'BHEUfE_ev.6Eib^2/3nu': {
      name: '☁ Cloud variable',
      isCloud: true
    }
  });
  expect(project.analysis.usesMusic).toBe(false);
});

test('sb3 with music', async () => {
  const project = await downloadProject(readTestProject('music.sb3'), () => {});
  expect(project.analysis.usesMusic).toBe(true);
});

test('sb2', async () => {
  const project = await downloadProject(readTestProject('no-music.sb2'), () => {});
  expect(project.blob.size).toBe(6259);
  expect(project.type).toBe('blob');
  expect(project.analysis.usesMusic).toBe(false);
  expect(project.analysis.stageVariables).toEqual({
    '☁ Variable': {
      name: '☁ Variable',
      isCloud: true
    },
    'Variable 2': {
      name: 'Variable 2',
      isCloud: false
    }
  });
});

test('sb2 with music', async () => {
  const project = await downloadProject(readTestProject('music.sb2'), () => {});
  expect(project.blob.size).toBe(6293);
  expect(project.type).toBe('blob');
  expect(project.analysis.usesMusic).toBe(true);
});

test('sb', async () => {
  const project = await downloadProject(readTestProject('project.sb'), () => {});
  expect(project.blob.size).toBe(554);
  expect(project.type).toBe('blob');
});

test('invalid project', async () => {
  try {
    await downloadProject(readTestProject('invalid.txt'), () => {});
  } catch (e) {
    return;
  }
  throw new Error('Expected error, got success');
});

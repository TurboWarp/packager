import fs from 'fs';
import path from 'path';
import {downloadProject} from '../../src/packager/download-project'

const readTestProject = (name) => {
  const buffer = fs.readFileSync(path.resolve(__dirname, 'projects', name));
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};

test('sb3', async () => {
  const project = await downloadProject(readTestProject('no-music.sb3'), () => {});
  expect(project.type).toBe('sb3');
  expect(project.analysis.stageVariables).toEqual([
    {
      name: 'my variable',
      isCloud: false
    },
    {
      name: '☁ Cloud variable',
      isCloud: true
    }
  ]);
  expect(project.analysis.usesMusic).toBe(false);
  expect(project.analysis.extensions).toStrictEqual([]);
});

test('sb3 with implied cloud variables', async () => {
  const project = await downloadProject(readTestProject('implied-cloud-variables.sb3'), () => {});
  expect(project.type).toBe('sb3');
  expect(project.analysis.stageVariables).toEqual([
    {
      name: '☁ Implied',
      isCloud: true
    }
  ]);
});

test('sb3 with comments', async () => {
  const project = await downloadProject(readTestProject('comments.sb3'), () => {});
  expect(project.type).toBe('sb3');
  expect(project.analysis.stageComments).toEqual([
    'This comment contains configuration for gamepad support in third-party tools or websites such as https://turbowarp.org/\nDo not edit by hand\n{\"axes\":[{\"type\":\"virtual_cursor\",\"high\":\"+x\",\"low\":\"-x\",\"sensitivity\":0.6,\"deadZone\":0.2},{\"type\":\"virtual_cursor\",\"high\":\"-y\",\"low\":\"+y\",\"sensitivity\":0.6,\"deadZone\":0.2},{\"type\":\"virtual_cursor\",\"high\":\"+x\",\"low\":\"-x\",\"sensitivity\":0.6,\"deadZone\":0.2},{\"type\":\"virtual_cursor\",\"high\":\"-y\",\"low\":\"+y\",\"sensitivity\":0.6,\"deadZone\":0.2}],\"buttons\":[{\"type\":\"key\",\"high\":null},{\"type\":\"key\",\"high\":null},{\"type\":\"key\",\"high\":null},{\"type\":\"key\",\"high\":null},{\"type\":\"mousedown\"},{\"type\":\"mousedown\"},{\"type\":\"mousedown\"},{\"type\":\"mousedown\"},{\"type\":\"key\",\"high\":null},{\"type\":\"key\",\"high\":null},{\"type\":\"key\",\"high\":null},{\"type\":\"key\",\"high\":null},{\"type\":\"key\",\"high\":\"ArrowUp\"},{\"type\":\"key\",\"high\":\"ArrowDown\"},{\"type\":\"key\",\"high\":\"ArrowLeft\"},{\"type\":\"key\",\"high\":\"ArrowRight\"},{\"type\":\"key\",\"high\":null}]} // _gamepad_',
    'Configuration for https://turbowarp.org/\nYou can move, resize, and minimize this comment, but don\'t edit it by hand. This comment can be deleted to remove the stored settings.\n{\"framerate\":30,\"runtimeOptions\":{\"maxClones\":300,\"miscLimits\":true,\"fencing\":true},\"interpolation\":false,\"turbo\":false,\"hq\":false} // _twconfig_'
  ]);
});

test('sb3 with music', async () => {
  const project = await downloadProject(readTestProject('music.sb3'), () => {});
  expect(project.analysis.usesMusic).toBe(true);
});

test('sb2', async () => {
  const project = await downloadProject(readTestProject('no-music.sb2'), () => {});
  expect(project.arrayBuffer.byteLength).toBe(6259);
  expect(project.type).toBe('blob');
  expect(project.analysis.usesMusic).toBe(false);
  expect(project.analysis.stageVariables).toEqual([
    {
      name: '☁ Variable',
      isCloud: true
    },
    {
      name: 'Variable 2',
      isCloud: false
    }
  ]);
  expect(project.analysis.extensions).toStrictEqual([]);
});

test('sb2 with music', async () => {
  const project = await downloadProject(readTestProject('music.sb2'), () => {});
  expect(project.arrayBuffer.byteLength).toBe(6293);
  expect(project.type).toBe('blob');
  expect(project.analysis.usesMusic).toBe(true);
});

test('sb', async () => {
  const project = await downloadProject(readTestProject('project.sb'), () => {});
  expect(project.arrayBuffer.byteLength).toBe(554);
  expect(project.type).toBe('blob');
  expect(project.analysis.extensions).toStrictEqual([]);
});

test('subdirectory', async () => {
  const project = await downloadProject(readTestProject('subdirectory.sb3'), () => {});
  expect(project.type).toBe('sb3');
});

test('invalid project', async () => {
  try {
    await downloadProject(readTestProject('invalid.txt'), () => {});
  } catch (e) {
    return;
  }
  throw new Error('Expected error, got success');
});

test('custom extensions', async () => {
  const project = await downloadProject(readTestProject('fetch.sb3'), () => {});
  expect(project.analysis.extensions).toStrictEqual([
    'https://extensions.turbowarp.org/fetch.js'
  ]);
});

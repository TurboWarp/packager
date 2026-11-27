import {test} from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import JSZip from '@turbowarp/jszip';
import {downloadProject} from '../../src/packager/download-project.js'

const readTestProject = (name) => {
  const buffer = fs.readFileSync(path.resolve(import.meta.dirname, 'projects', name));
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};

test('sb3', async () => {
  const project = await downloadProject(readTestProject('no-music.sb3'), () => {});
  assert.strictEqual(project.type, 'sb3');
  assert.deepStrictEqual(project.analysis.stageVariables, [
    {
      name: 'my variable',
      isCloud: false
    },
    {
      name: '☁ Cloud variable',
      isCloud: true
    }
  ]);
  assert.strictEqual(project.analysis.usesMusic, false);
  assert.deepStrictEqual(project.analysis.extensions, []);
});

test('sb3 with implied cloud variables', async () => {
  const project = await downloadProject(readTestProject('implied-cloud-variables.sb3'), () => {});
  assert.strictEqual(project.type, 'sb3');
  assert.deepStrictEqual(project.analysis.stageVariables, [
    {
      name: '☁ Implied',
      isCloud: true
    }
  ]);
});

test('sb3 with disabled cloud variables', async () => {
  const project = await downloadProject(readTestProject('disabled-cloud-variables.sb3'), () => {});
  assert.strictEqual(project.type, 'sb3');
  assert.deepStrictEqual(project.analysis.stageVariables, [
    {
      name: '☁ potential reporters',
      isCloud: false
    },
    {
      name: '☁ Implied',
      isCloud: true
    }
  ]);
  const zip = await JSZip.loadAsync(project.arrayBuffer);
  const json = JSON.parse(await zip.file('project.json').async('text'));
  assert.deepStrictEqual(json.targets[0].variables['QqN3g5B}a/kJ6O`XZQUd'], ['☁ potential reporters', '']);
  assert.deepStrictEqual(json.targets[0].variables['m/1@VP1Ko9amvO.`R4{d'], ['☁ Implied', 0, true]);
});

test('sb3 with comments', async () => {
  const project = await downloadProject(readTestProject('comments.sb3'), () => {});
  assert.strictEqual(project.type, 'sb3');
  assert.deepStrictEqual(project.analysis.stageComments, [
    'This comment contains configuration for gamepad support in third-party tools or websites such as https://turbowarp.org/\nDo not edit by hand\n{\"axes\":[{\"type\":\"virtual_cursor\",\"high\":\"+x\",\"low\":\"-x\",\"sensitivity\":0.6,\"deadZone\":0.2},{\"type\":\"virtual_cursor\",\"high\":\"-y\",\"low\":\"+y\",\"sensitivity\":0.6,\"deadZone\":0.2},{\"type\":\"virtual_cursor\",\"high\":\"+x\",\"low\":\"-x\",\"sensitivity\":0.6,\"deadZone\":0.2},{\"type\":\"virtual_cursor\",\"high\":\"-y\",\"low\":\"+y\",\"sensitivity\":0.6,\"deadZone\":0.2}],\"buttons\":[{\"type\":\"key\",\"high\":null},{\"type\":\"key\",\"high\":null},{\"type\":\"key\",\"high\":null},{\"type\":\"key\",\"high\":null},{\"type\":\"mousedown\"},{\"type\":\"mousedown\"},{\"type\":\"mousedown\"},{\"type\":\"mousedown\"},{\"type\":\"key\",\"high\":null},{\"type\":\"key\",\"high\":null},{\"type\":\"key\",\"high\":null},{\"type\":\"key\",\"high\":null},{\"type\":\"key\",\"high\":\"ArrowUp\"},{\"type\":\"key\",\"high\":\"ArrowDown\"},{\"type\":\"key\",\"high\":\"ArrowLeft\"},{\"type\":\"key\",\"high\":\"ArrowRight\"},{\"type\":\"key\",\"high\":null}]} // _gamepad_',
    'Configuration for https://turbowarp.org/\nYou can move, resize, and minimize this comment, but don\'t edit it by hand. This comment can be deleted to remove the stored settings.\n{\"framerate\":30,\"runtimeOptions\":{\"maxClones\":300,\"miscLimits\":true,\"fencing\":true},\"interpolation\":false,\"turbo\":false,\"hq\":false} // _twconfig_'
  ]);
});

test('sb3 with music', async () => {
  const project = await downloadProject(readTestProject('music.sb3'), () => {});
  assert.strictEqual(project.analysis.usesMusic, true);
});

test('sb2', async () => {
  const project = await downloadProject(readTestProject('no-music.sb2'), () => {});
  assert.strictEqual(project.arrayBuffer.byteLength, 6259);
  assert.strictEqual(project.type, 'blob');
  assert.strictEqual(project.analysis.usesMusic, false);
  assert.deepStrictEqual(project.analysis.stageVariables, [
    {
      name: '☁ Variable',
      isCloud: true
    },
    {
      name: 'Variable 2',
      isCloud: false
    }
  ]);
  assert.deepStrictEqual(project.analysis.extensions, []);
});

test('sb2 with music', async () => {
  const project = await downloadProject(readTestProject('music.sb2'), () => {});
  assert.strictEqual(project.arrayBuffer.byteLength, 6293);
  assert.strictEqual(project.type, 'blob');
  assert.strictEqual(project.analysis.usesMusic, true);
});

test('sb', async () => {
  const project = await downloadProject(readTestProject('project.sb'), () => {});
  assert.strictEqual(project.arrayBuffer.byteLength, 554);
  assert.strictEqual(project.type, 'blob');
  assert.deepStrictEqual(project.analysis.extensions, []);
});

test('subdirectory', async () => {
  const project = await downloadProject(readTestProject('subdirectory.sb3'), () => {});
  assert.strictEqual(project.type, 'sb3');
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
  assert.deepStrictEqual(project.analysis.extensions, [
    'https://extensions.turbowarp.org/fetch.js'
  ]);
});

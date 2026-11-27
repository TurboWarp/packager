import {test} from 'node:test';
import assert from 'node:assert';
import {verifyBuildId} from "../../src/packager/build-id.js";

test('verifyBuildId', () => {
  assert.strictEqual(verifyBuildId('81868e39f131a7c61c505fdeb5ed4731c3fd2420ab31fb9210175b4bb705d9a4', 'abc 123 // 81868e39f131a7c61c505fdeb5ed4731c3fd2420ab31fb9210175b4bb705d9a4 =^..^='), true);
  assert.strictEqual(verifyBuildId('redgtoikjergorljikef', 'abc 123 //redgtoikjergorljikef =^..^='), true);
  assert.strictEqual(verifyBuildId('redgtoikjergorljikef', 'abc 123 // gfrdvetgfroi =^..^='), false);
  assert.strictEqual(verifyBuildId('redgtoikjergorljikef', 'abc 123'), true);
});

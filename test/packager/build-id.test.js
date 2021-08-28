import {verifyBuildId} from "../../src/packager/build-id";

test('verifyBuildId', () => {
  expect(verifyBuildId('81868e39f131a7c61c505fdeb5ed4731c3fd2420ab31fb9210175b4bb705d9a4', 'abc 123 // 81868e39f131a7c61c505fdeb5ed4731c3fd2420ab31fb9210175b4bb705d9a4 =^..^=')).toBe(true);
  expect(verifyBuildId('redgtoikjergorljikef', 'abc 123 //redgtoikjergorljikef =^..^=')).toBe(true);
  expect(verifyBuildId('redgtoikjergorljikef', 'abc 123 // gfrdvetgfroi =^..^=')).toBe(false);
  expect(verifyBuildId('redgtoikjergorljikef', 'abc 123')).toBe(true);
});

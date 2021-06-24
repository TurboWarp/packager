import * as Comlink from 'comlink';
import {sha256 as sha256_} from 'hash-wasm/dist/sha256.umd.min.js';

const sha256 = async (buffer) => {
  const checksum = await sha256_(new Uint8Array(buffer));
  return checksum;
};

Comlink.expose({
  sha256
});

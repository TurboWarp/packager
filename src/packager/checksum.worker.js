import * as Comlink from 'comlink';
import shajs from 'sha.js';

const sha256 = (buffer) => {
  return shajs('sha256').update(new Uint8Array(buffer)).digest('hex');
};

Comlink.expose({
  sha256
});

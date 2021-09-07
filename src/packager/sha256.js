import shajs from 'sha.js';

export const sha256 = (buffer) => {
  return shajs('sha256').update(new Uint8Array(buffer)).digest('hex');
};

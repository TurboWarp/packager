import {encode, decode} from '../../src/packager/base85';
import {TextEncoder, TextDecoder} from 'fastestsmallesttextencoderdecoder';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

test('base85 encode and decode', () => {
  for (let i = 0; i < 10; i++) {
    const view = new Uint8Array(Math.random() * 10000);
    for (let i = 0; i < view.length; i++) {
      view[i] = Math.random() * 255;
    }
    const encoded = encode(view.buffer.slice(view.byteOffset, view.byteLength));
    const decoded = decode(encoded);
    expect(decoded).toEqual(view);
  }
});

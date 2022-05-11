// Legacy Edge supports all the syntax we use but not TextDecoder and TextEncoder
export const isSupported = typeof TextDecoder === 'function';

export const isSafari = navigator.vendor === 'Apple Computer, Inc.';

export const isChromeOS = navigator.userAgent.includes('CrOS');

export const isStandalone = !!process.env.STANDALONE;

export const version = process.env.VERSION;

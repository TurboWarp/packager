const sha256 = async (arrayBuffer) => {
  // Use the browser's builtin SHA-256 if possible.
  // This API might not exist if we're not a secure context or in versions of Node that aren't even that old,
  // so we also have a pure JS fallback.
  if (typeof crypto === 'object' && crypto.subtle && crypto.subtle.digest) {
    const rawData = await crypto.subtle.digest('SHA-256', arrayBuffer);
    return Array.from(new Uint8Array(rawData)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // The checksum will be performed on the main thread and may take a while.
  const SHA256 = (await import(/* webpackChunkName: "sha256" */ 'sha.js/sha256')).default;
  const hash = new SHA256();
  // new Uint8Array() is necessary to make this work in Node
  hash.update(new Uint8Array(arrayBuffer));
  return hash.digest('hex');
};

export default sha256;

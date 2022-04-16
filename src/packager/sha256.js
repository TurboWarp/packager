const sha256 = async (arrayBuffer) => {
  // Use the browser's builtin SHA-256 if possible.
  // This API might not exist if we're not a secure context or in versions of Node that aren't even that old,
  // so we also have a pure JS fallback.
  if (typeof crypto === 'object' && crypto.subtle && crypto.subtle.digest) {
    const rawData = await crypto.subtle.digest('SHA-256', arrayBuffer);
    return Array.from(new Uint8Array(rawData)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const shajs = await import(/* webpackChunkName: "shajs" */ 'sha.js');
  // Note: this will block the main thread for a while.
  return shajs.default('sha256').update(new Uint8Array(arrayBuffer)).digest('hex');
};

export default sha256;

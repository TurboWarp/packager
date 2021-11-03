module.exports = () => {
  if (process.env.STANDALONE) {
    const now = new Date();
    const dateString = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    return `export default ${JSON.stringify(`Standalone version (${dateString})`)}`;
  }
  return `export default null;`;
};

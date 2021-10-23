module.exports = () => {
  if (process.env.STANDALONE) {
    const now = new Date();
    return `export default ${JSON.stringify(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`)};`;
  }
  return `export default null;`;
};

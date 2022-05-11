const downloadURL = (filename, url) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export default downloadURL;

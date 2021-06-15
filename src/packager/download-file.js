const downloadFile = (obj, filename) => {
  const blob = new Blob([obj]);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return url;
};

export default downloadFile;

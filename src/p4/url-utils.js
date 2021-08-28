export const extractProjectId = (text) => {
  const match = text.match(/\d+/);
  if (!match) {
    return '';
  }
  return match[0];
};

export const isValidURL = (str) => {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

export const getTitleFromURL = (url) => {
  const match = url.match(/\/([^\/]+)\.sb[2|3]?$/);
  if (match) {
    return match[1];
  }
  return '';
};

class Image {
  constructor (mimeType, data) {
    this.mimeType = mimeType;
    this.buffer = Buffer.from(data);
  }

  readAsURL() {
    return `data:${this.mimeType};base64,${this.buffer.toString('base64')}`;
  }
}

export default Image;

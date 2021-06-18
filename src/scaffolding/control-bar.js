import styles from './style.css';

class ControlBar {
  constructor () {
    this.root = document.createElement('div');
    this.root.className = styles.controlsBar;
    this.start = document.createElement('div');
    this.end = document.createElement('div');
    this.root.appendChild(this.start);
    this.root.appendChild(this.end);
  }

  addToStart (el) {
    this.start.appendChild(el);
  }

  addToEnd (el) {
    this.end.appendChild(el);
  }

  computeHeight () {
    let max = 0;
    for (const child of [...this.start.childNodes, ...this.end.childNodes]) {
      const height = child.offsetHeight;
      if (height > max) {
        max = height;
      }
    }
    return max;
  }
}

export default ControlBar;

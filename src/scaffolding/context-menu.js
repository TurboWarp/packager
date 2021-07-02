import styles from './style.css';

class ContextMenu {
  constructor (parent) {
    this.parent = parent;

    this.root = document.createElement('div');
    this.root.className = styles.contextMenu;

    this._onmousedown = this._onmousedown.bind(this);
    this._onresize = this._onresize.bind(this);
  }

  _onmousedown (e) {
    if (!this.root.contains(e.target)) {
      this.destroy();
    }
  }

  _onresize () {
    this.destroy();
  }

  add (option) {
    const item = document.createElement('button');
    item.className = styles.contextMenuItem;
    item.textContent = option.text;
    item.addEventListener('click', () => {
      this.destroy();
      option.callback();
    });
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    this.root.appendChild(item);
  }

  show (mouseEvent) {
    document.addEventListener('mousedown', this._onmousedown);
    window.addEventListener('resize', this._onresize);
    const layersRect = this.parent.layersRect;
    const x = mouseEvent.clientX - layersRect.left + 1;
    const y = mouseEvent.clientY - layersRect.top + 1;
    this.root.style.transform = `translate(${x}px, ${y}px)`;
    this.parent._addLayer(this.root);
    getComputedStyle(this.root).opacity;
    this.root.style.opacity = '1';
  }

  destroy () {
    document.removeEventListener('mousedown', this._onmousedown);
    window.removeEventListener('resize', this._onresize);
    this.root.style.opacity = '0';
    this.root.style.pointerEvents = 'none';
    setTimeout(() => {
      this.root.remove();
    }, 200);
  }
}

export default ContextMenu;

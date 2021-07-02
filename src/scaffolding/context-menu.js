import styles from './style.css';

class ContextMenu {
  constructor (parent) {
    this.parent = parent;

    this.root = document.createElement('div');
    this.root.className = styles.contextMenu;

    this._onmousedown = this._onmousedown.bind(this)
  }

  _onmousedown (e) {
    if (!this.root.contains(e.target)) {
      this.destroy();
    }
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
    const layersRect = this.parent.layersRect;
    const x = mouseEvent.clientX - layersRect.left + 1;
    const y = mouseEvent.clientY - layersRect.top + 1;
    this.root.style.transform = `translate(${x}px, ${y}px)`;
    this.parent._addLayer(this.root);
  }

  destroy () {
    document.removeEventListener('mousedown', this._onmousedown);
    this.root.remove();
  }
}

export default ContextMenu;

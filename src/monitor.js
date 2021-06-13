import styles from './style.css';

class VariableMonitor {
  constructor (parent, monitor) {
    this.parent = parent;

    this.id = monitor.get('id');
    this.spriteName = monitor.get('spriteName');
    this.targetId = monitor.get('targetId');
    this.opcode = monitor.get('opcode');
    this.params = monitor.get('params');

    this.root = document.createElement('div');
    this.root.className = styles.monitorRoot;
    this.root.setAttribute('opcode', this.opcode);

    this.inner = document.createElement('div');
    this.inner.className = styles.monitorInner;

    this.valueRow = document.createElement('div');
    this.valueRow.className = styles.monitorRow;

    this.label = document.createElement('div');
    this.label.className = styles.monitorLabel;
    this.label.textContent = this.getLabel();

    this.value = document.createElement('div');
    this.value.className = styles.monitorValue;

    this.valueRow.appendChild(this.label);
    this.valueRow.appendChild(this.value);
    this.inner.appendChild(this.valueRow);
    this.root.appendChild(this.inner);
    this.parent._monitorOverlay.appendChild(this.root);
  }

  getLabel () {
    let base;
    if (Object.keys(this.params).length) {
      base = this.params[Object.keys(this.params)[0]];
    } else {
      base = this.id;
    }

    if (this.spriteName) {
      return `${this.spriteName}: ${base}`;
    }
    return base;
  }

  update (monitor) {
    const x = monitor.get('x');
    const y = monitor.get('y');
    const value = monitor.get('value');
    const visible = monitor.get('visible');

    this.root.style.transform = `translate(${x}px, ${y}px)`;
    this.value.textContent = value;

    this.root.style.display = visible ? '' : 'none';
  }
}

export {
  VariableMonitor
};

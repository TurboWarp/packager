import styles from './style.css';

class Monitor {
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
    // TODO: don't touch if not changed
    const x = monitor.get('x');
    const y = monitor.get('y');
    const visible = monitor.get('visible');
    this.root.style.transform = `translate(${x}px, ${y}px)`;
    this.root.style.display = visible ? '' : 'none';
  }
}

class VariableMonitor extends Monitor {
  constructor (parent, monitor) {
    super(parent, monitor);

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

  update (monitor) {
    const value = monitor.get('value');
    this.value.textContent = value;
  }
}

const ROW_HEIGHT = 20;

class Row {
  constructor () {
    this._index = -1;
    this._value = '';
    this._visible = true;

    this.root = document.createElement('div');
    this.root.className = styles.monitorRowRoot;
    this.indexEl = document.createElement('div');
    this.indexEl.className = styles.monitorRowIndex;
    this.valueEl = document.createElement('div');
    this.valueEl.className = styles.monitorRowValue;
    this.root.appendChild(this.indexEl);
    this.root.appendChild(this.valueEl);
  }

  setIndex (index) {
    if (this._index !== index) {
      this._index = index;
      this.root.style.transform = `translateY(${index * ROW_HEIGHT}px)`;
      this.indexEl.textContent = index + 1;
    }
  }

  setValue (value) {
    if (this._value !== value) {
      this._value = value;
      this.valueEl.textContent = value;
    }
  }

  setVisible (visible) {
    if (this._visible !== visible) {
      this._visible = visible;
      this.root.style.display = visible ? '' : 'none';
    }
  }
}

class ListMonitor extends Monitor {
  constructor (parent, monitor) {
    super(parent, monitor);

    this.rows = [];
    this.scrollTop = 0;

    this.rowsOuter = document.createElement('div');
    this.rowsOuter.className = styles.monitorRowsOuter;

    this.rowsInner = document.createElement('div');
    this.rowsInner.className = styles.monitorRowsInner;
    this.rowsInner.addEventListener('scroll', this._onscroll.bind(this));

    this.endPoint = document.createElement('div');
    this.endPoint.className = styles.monitorRowsEndpoint;

    this.rowsInner.appendChild(this.endPoint);
    this.rowsOuter.appendChild(this.rowsInner);
    this.root.appendChild(this.rowsOuter);
  }

  _onscroll (e) {
    this.scrollTop = e.target.scrollTop;
    this.updateValue(this.value);
  }

  getRow () {
    if (this.rows.length) {
      return this.rows.pop();
    }
    return new Row();
  }

  update (monitor) {
    super.update(monitor);

    this.width = monitor.get('width') || 200;
    this.height = monitor.get('height') || 200;
    this.root.style.width = `${this.width}px`;
    this.root.style.height = `${this.height}px`;

    this.value = monitor.get('value');
    this.updateValue(this.value);
  }

  updateValue (value) {
    this.endPoint.style.transform = `translateY(${value.length * ROW_HEIGHT}px)`;

    let startIndex = Math.floor(this.scrollTop / ROW_HEIGHT) - 5;
    if (startIndex < 0) startIndex = 0;
    let endIndex = Math.ceil((this.scrollTop + this.height) / ROW_HEIGHT) + 5;
    if (endIndex > value.length - 1) endIndex = value.length - 1;

    const rowsNeeded = endIndex - startIndex + 1;
    while (this.rows.length < rowsNeeded) {
      const row = new Row();
      this.rows.push(row);
      this.rowsInner.appendChild(row.root);
    }
    for (var i = 0; i < rowsNeeded; i++) {
      const row = this.rows[i];
      const rowIndex = i + startIndex;
      row.setIndex(rowIndex);
      row.setValue(value[rowIndex]);
      row.setVisible(true);
    }
    while (i < this.rows.length) {
      const row = this.rows[i];
      row.setVisible(false);
      i++;
    }
  }
}

export {
  VariableMonitor,
  ListMonitor
};

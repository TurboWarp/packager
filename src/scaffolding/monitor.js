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
    this.x = monitor.get('x');
    this.y = monitor.get('y');
    this.visible = monitor.get('visible');
    this.root.style.transform = `translate(${this.x}px, ${this.y}px)`;
    this.root.style.display = this.visible ? '' : 'none';
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

    this.valueElement = document.createElement('div');
    this.valueElement.className = styles.monitorValue;

    this.valueRow.appendChild(this.label);
    this.valueRow.appendChild(this.valueElement);
    this.inner.appendChild(this.valueRow);
    this.root.appendChild(this.inner);
    this.parent._monitorOverlay.appendChild(this.root);
  }

  update (monitor) {
    super.update(monitor);

    if (!this.visible) {
      return;
    }

    const value = monitor.get('value');
    this.valueElement.textContent = value;
  }
}

const ROW_HEIGHT = 24;

class Row {
  constructor () {
    this._index = -1;
    this._value = '';
    this._visible = true;

    this.root = document.createElement('div');
    this.root.className = styles.monitorRowRoot;
    this.indexEl = document.createElement('div');
    this.indexEl.className = styles.monitorRowIndex;
    this.valueOuter = document.createElement('div');
    this.valueOuter.className = styles.monitorRowValueOuter;
    this.valueInner = document.createElement('div');
    this.valueInner.className = styles.monitorRowValueInner;
    this.valueOuter.appendChild(this.valueInner);
    this.root.appendChild(this.indexEl);
    this.root.appendChild(this.valueOuter);
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
      this.valueInner.textContent = value;
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

    this.label = document.createElement('div');
    this.label.className = styles.monitorListLabel;
    this.label.textContent = this.getLabel();

    this.footer = document.createElement('div');
    this.footer.className = styles.monitorListFooter;

    this.rowsOuter = document.createElement('div');
    this.rowsOuter.className = styles.monitorRowsOuter;

    this.rowsInner = document.createElement('div');
    this.rowsInner.className = styles.monitorRowsInner;
    this.rowsInner.addEventListener('scroll', this._onscroll.bind(this));

    this.endPoint = document.createElement('div');
    this.endPoint.className = styles.monitorRowsEndpoint;

    this.rowsInner.appendChild(this.endPoint);
    this.rowsOuter.appendChild(this.rowsInner);
    this.root.appendChild(this.label);
    this.root.appendChild(this.rowsOuter);
    this.root.appendChild(this.footer);
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

    if (!this.visible) {
      return;
    }

    this.width = monitor.get('width') || 100;
    this.height = monitor.get('height') || 200;
    this.root.style.width = `${this.width}px`;
    this.root.style.height = `${this.height}px`;

    this.value = monitor.get('value');
    this.footer.textContent = `length ${this.value.length}`;
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

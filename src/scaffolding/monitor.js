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
    let label;
    if (this.opcode === 'data_variable') {
      label = this.params.VARIABLE;
    } else if (this.opcode === 'data_listcontents') {
      label = this.params.LIST;
    } else if (this.opcode === 'motion_xposition') {
      label = 'x position';
    } else if (this.opcode === 'motion_yposition') {
      label = 'y position';
    } else if (this.opcode === 'motion_direction') {
      label = 'direction';
    } else if (this.opcode === 'sensing_username') {
      label = 'username';
    } else if (this.opcode === 'looks_costumenumbername') {
      if (this.params.NUMBER_NAME === 'number') {
        label = 'costume number';
      } else {
        label = 'costume name';
      }
    } else if (this.opcode === 'looks_backdropnumbername') {
      if (this.params.NUMBER_NAME === 'number') {
        label = 'backdrop number';
      } else {
        label = 'backdrop name';
      }
    } else if (this.opcode === 'looks_size') {
      label = 'size';
    } else if (this.opcode === 'sensing_answer') {
      label = 'answer';
    } else if (this.opcode === 'sensing_loudness') {
      label = 'loudness';
    } else if (this.opcode === 'sensing_timer') {
      label = 'timer';
    } else if (this.opcode === 'sound_volume') {
      label = 'volume';
    } else if (this.opcode === 'sensing_current') {
      const menu = this.params.CURRENTMENU.toLowerCase();
      if (menu === 'year') {
        label = 'year';
      } else if (menu === 'month') {
        label = 'month';
      } else if (menu === 'date') {
        label = 'date';
      } else if (menu === 'dayofweek') {
        label = 'day of week';
      } else if (menu === 'hour') {
        label = 'hour';
      } else if (menu === 'minute') {
        label = 'minute';
      } else if (menu === 'second') {
        label = 'second';
      }
    } else {
      label = this.parent.vm.runtime.getLabelForOpcode(this.opcode).label;
    }

    if (this.spriteName) {
      return `${this.spriteName}: ${label}`;
    }
    return label;
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

    this.mode = monitor.get('mode');

    if (this.mode === 'large') {
      this.valueElement = document.createElement('div');
      this.valueElement.className = styles.monitorLargeValue + ' ' + styles.monitorValueColor;

      this.root.appendChild(this.valueElement);
    } else {
      this.inner = document.createElement('div');
      this.inner.className = styles.monitorInner;
  
      this.valueRow = document.createElement('div');
      this.valueRow.className = styles.monitorRow;
  
      this.label = document.createElement('div');
      this.label.className = styles.monitorLabel;
      this.label.textContent = this.getLabel();
  
      this.valueElement = document.createElement('div');
      this.valueElement.className = styles.monitorValue + ' ' + styles.monitorValueColor;
  
      this.valueRow.appendChild(this.label);
      this.valueRow.appendChild(this.valueElement);
      this.inner.appendChild(this.valueRow);
  
      if (this.mode === 'slider') {
        this.sliderRow = document.createElement('div');
        this.sliderRow.className = styles.monitorRow;
  
        this.slider = document.createElement('input');
        this.slider.className = styles.monitorSlider;
        this.slider.type = 'range';
        this.slider.min = monitor.get('sliderMin');
        this.slider.max = monitor.get('sliderMax');
        this.slider.step = monitor.get('isDiscrete') ? 1 : 0.01;
        this.slider.addEventListener('input', this.onsliderchange.bind(this));
  
        this.sliderRow.appendChild(this.slider);
        this.inner.appendChild(this.sliderRow);
      }

      this.root.appendChild(this.inner);
    }

    this.parent._monitorOverlay.appendChild(this.root);

    this._value = '';
  }

  setVariableValue (value) {
    let target;
    if (this.targetId) {
      target = this.parent.vm.runtime.getTargetById(this.targetId);
    } else {
      target = this.parent.vm.runtime.getTargetForStage();
    }
    const variable = target.variables[this.id];
    variable.value = value;
    this._value = value;
    this.valueElement.textContent = value;
  }

  onsliderchange (e) {
    this.setVariableValue(+e.target.value);
  }

  update (monitor) {
    super.update(monitor);

    if (!this.visible) {
      return;
    }

    let value = monitor.get('value');
    if (typeof value === 'number') {
      value = Number(value.toFixed(6));
    }
    if (this._value !== value) {
      this._value = value;
      this.valueElement.textContent = value;
      if (this.slider) {
        this.slider.value = value;
      }
    }
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

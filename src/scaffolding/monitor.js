import ContextMenu from './context-menu';
import DropArea from './drop-area';
import styles from './style.css';
import {readAsText} from '../common/readers';

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
      label = this.parent.getMessage('var-x');
    } else if (this.opcode === 'motion_yposition') {
      label = this.parent.getMessage('var-y');
    } else if (this.opcode === 'motion_direction') {
      label = this.parent.getMessage('var-direction');
    } else if (this.opcode === 'sensing_username') {
      label = this.parent.getMessage('var-username');
    } else if (this.opcode === 'looks_costumenumbername') {
      if (this.params.NUMBER_NAME === 'number') {
        label = this.parent.getMessage('var-costume-number');
      } else {
        label = this.parent.getMessage('var-costume-name');
      }
    } else if (this.opcode === 'looks_backdropnumbername') {
      if (this.params.NUMBER_NAME === 'number') {
        label = this.parent.getMessage('var-backdrop-number');
      } else {
        label = this.parent.getMessage('var-backdrop-name');
      }
    } else if (this.opcode === 'looks_size') {
      label = this.parent.getMessage('var-size');
    } else if (this.opcode === 'sensing_answer') {
      label = this.parent.getMessage('var-answer');
    } else if (this.opcode === 'sensing_loudness') {
      label = this.parent.getMessage('var-loudness');
    } else if (this.opcode === 'sensing_timer') {
      label = this.parent.getMessage('var-timer');
    } else if (this.opcode === 'sound_volume') {
      label = this.parent.getMessage('var-volume');
    } else if (this.opcode === 'sensing_current') {
      const menu = this.params.CURRENTMENU.toLowerCase();
      if (menu === 'year') {
        label = this.parent.getMessage('var-year');
      } else if (menu === 'month') {
        label = this.parent.getMessage('var-month');
      } else if (menu === 'date') {
        label = this.parent.getMessage('var-date');
      } else if (menu === 'dayofweek') {
        label = this.parent.getMessage('var-day-of-week');
      } else if (menu === 'hour') {
        label = this.parent.getMessage('var-hour');
      } else if (menu === 'minute') {
        label = this.parent.getMessage('var-minute');
      } else if (menu === 'second') {
        label = this.parent.getMessage('var-second');
      }
    } else {
      label = this.parent.vm.runtime.getLabelForOpcode(this.opcode).label;
    }

    if (this.spriteName) {
      return `${this.spriteName}: ${label}`;
    }
    return label;
  }

  getTarget () {
    if (this.targetId) {
      return this.parent.vm.runtime.getTargetById(this.targetId);
    }
    return this.parent.vm.runtime.getTargetForStage();
  }

  getVmVariable () {
    const target = this.getTarget();
    return target.variables[this.id];
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
    const variable = this.getVmVariable();
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
    this.rowsInner.addEventListener('scroll', this._onscroll.bind(this), {passive: true});

    this.endPoint = document.createElement('div');
    this.endPoint.className = styles.monitorRowsEndpoint;

    this.emptyLabel = document.createElement('div');
    this.emptyLabel.textContent = parent.getMessage('list-empty');
    this.emptyLabel.className = styles.monitorEmpty;

    this.rowsInner.appendChild(this.endPoint);
    this.rowsInner.appendChild(this.emptyLabel);
    this.rowsOuter.appendChild(this.rowsInner);
    this.root.appendChild(this.label);
    this.root.appendChild(this.rowsOuter);
    this.root.appendChild(this.footer);

    this.dropper = new DropArea(this.rowsOuter, this.dropperCallback.bind(this));

    this.handleImport = this.handleImport.bind(this);
    this.handleExport = this.handleExport.bind(this);
    this.root.addEventListener('contextmenu', this._oncontextmenu.bind(this));
  }

  _onscroll (e) {
    // If the list monitor is selected, we'll unselect it because the selection won't work properly.
    if (window.getSelection) {
      const selection = getSelection();
      if (selection && (this.rowsInner.contains(selection.anchorNode) || this.rowsInner.contains(selection.focusNode))) {
        if (selection.empty) {
          selection.empty();
        }
      }
    }
    this.scrollTop = e.target.scrollTop;
    this.updateValue(this.value);
  }


  _oncontextmenu (e) {
    e.preventDefault();
    const menu = new ContextMenu(this.parent);
    menu.add({
      text: this.parent.getMessage('list-import'),
      callback: this.handleImport
    });
    menu.add({
      text: this.parent.getMessage('list-export'),
      callback: this.handleExport
    });
    menu.show(e);
  }

  handleImport () {
    const fileSelector = document.createElement('input');
    fileSelector.type = 'file';
    fileSelector.accept = '.txt,.csv,.tsv';
    fileSelector.style.display = 'none';
    document.body.appendChild(fileSelector);
    fileSelector.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files.length === 0) return;
      const file = files[0];
      readAsText(file).then((text) => this.import(text));
    });
    fileSelector.click();
  }
  
  import (text) {
    // TODO: Scratch uses a CSV parser
    const lines = text.split(/\r?\n/);
    this.setValue(lines);
  }

  handleExport () {
    const value = this.getValue();
    const exported = value.join('\n');
    const blob = new Blob([exported], {
      type: 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${this.getLabel()}.txt`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  dropperCallback (texts) {
    this.import(texts.join('\n'));
  }

  getValue () {
    return this.getVmVariable().value;
  }

  setValue (value) {
    const variable = this.getVmVariable();
    variable.value = value;
    this.updateValue(value);
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
    this.footer.textContent = this.parent.getMessage('list-length').replace('{n}', this.value.length);
    this.updateValue(this.value);
  }

  updateValue (value) {
    this.endPoint.style.transform = `translateY(${value.length * ROW_HEIGHT}px)`;

    let startIndex = Math.floor(this.scrollTop / ROW_HEIGHT) - 5;
    if (startIndex < 0) startIndex = 0;
    let endIndex = Math.ceil((this.scrollTop + this.height) / ROW_HEIGHT) + 5;
    if (endIndex > value.length - 1) endIndex = value.length - 1;

    this.emptyLabel.style.display = value.length ? 'none' : '';

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

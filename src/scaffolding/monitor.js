import ContextMenu from './context-menu';
import DropArea from './drop-area';
import styles from './style.css';
import {readAsText} from '../common/readers';
import downloadBlob from './download';

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
    this.x = monitor.get('x');
    this.y = monitor.get('y');
    this.visible = monitor.get('visible');
    this.root.style.transform = `translate(${Math.round(this.x)}px, ${Math.round(this.y)}px)`;
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
  constructor (monitor) {
    this.monitor = monitor;

    this.index = -1;
    this.value = '';
    this.locked = false;

    this.root = document.createElement('label');
    this.root.className = styles.monitorRowRoot;

    this.indexEl = document.createElement('div');
    this.indexEl.className = styles.monitorRowIndex;

    this.valueOuter = document.createElement('div');
    this.valueOuter.className = styles.monitorRowValueOuter;

    this.editable = this.monitor.editable;
    if (this.editable) {
      this.valueInner = document.createElement('input');
      this.valueInner.tabIndex = -1;
      this.valueInner.className = styles.monitorRowValueInner;
      this.valueInner.readOnly = true;
      this.valueInner.addEventListener('click', this._onclickinput.bind(this));
      this.valueInner.addEventListener('blur', this._onblurinput.bind(this));
      this.valueInner.addEventListener('keypress', this._onkeypressinput.bind(this));
      this.valueInner.addEventListener('keydown', this._onkeypressdown.bind(this));
      this.valueInner.addEventListener('contextmenu', this._oncontextmenu.bind(this));
      this.valueInner.addEventListener('input', this._oninput.bind(this));
      this.valueOuter.appendChild(this.valueInner);

      this.deleteButton = document.createElement('button');
      this.deleteButton.className = styles.monitorRowDelete;
      this.deleteButton.textContent = '×';
      this.deleteButton.addEventListener('mousedown', this._onclickdelete.bind(this));
      this.valueOuter.appendChild(this.deleteButton);
    } else {
      this.valueInner = document.createElement('div');
      this.valueInner.className = styles.monitorRowValueInner;
      this.valueOuter.appendChild(this.valueInner);
      this.valueInner.addEventListener('contextmenu', this._oncontextmenuuneditable.bind(this));
    }

    this.root.appendChild(this.indexEl);
    this.root.appendChild(this.valueOuter);
  }

  _onclickinput () {
    this.valueInner.focus();
    if (this.locked) {
      return;
    }
    this.valueInner.select();
    this.valueInner.readOnly = false;
    this.locked = true;
    this.root.classList.add(styles.monitorRowValueEditing);

    this.addNewValue = false;
    this.deleteValue = false;
    this.valueWasChanged = false;
  }

  _onblurinput () {
    if (!this.locked) {
      return;
    }

    this.unfocus();

    if (this.deleteValue) {
      const value = [...this.monitor.value];
      value.splice(this.index, 1);
      this.monitor.setValue(value);
      this.monitor.tryToFocusRow(Math.min(value.length - 1, this.index))
    } else if (this.valueWasChanged || this.addNewValue) {
      const value = [...this.monitor.value];
      value[this.index] = this.valueInner.value;
      if (this.addNewValue) {
        value.splice(this.index + 1, 0, '');
      }
      this.monitor.setValue(value);
      if (this.addNewValue) {
        this.monitor.tryToFocusRow(this.index + 1);
      }
    }
  }

  _oninput () {
    this.valueWasChanged = true;
  }

  _onkeypressinput (e) {
    if (e.key === 'Enter') {
      this.addNewValue = true;
      this.valueInner.blur();
    }
  }

  _onkeypressdown (e) {
    if (e.key === 'Escape') {
      this.valueInner.blur();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Tab') {
      e.preventDefault();
      let index = this.index;
      if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        index--;
        if (index < 0) index = this.monitor.value.length - 1;
      } else {
        index++;
        if (index >= this.monitor.value.length) index = 0;
      }
      this.monitor.tryToFocusRow(index);
    }
  }

  _onclickdelete (e) {
    e.preventDefault();
    this.deleteValue = true;
    this.valueInner.blur();
  }

  _oncontextmenu (e) {
    if (this.locked) {
      // Open native context menu instead of custom list one when editing
      e.stopPropagation();
    } else {
      // Right clicking should not focus and highlight input
      e.preventDefault();
    }
  }

  _oncontextmenuuneditable (e) {
    // When row has been highlighted, eg. by triple click, open native context menu instead of custom
    const selection = getSelection();
    if (this.valueInner.contains(selection.anchorNode) && !selection.isCollapsed) {
      e.stopPropagation();
    }
  }

  setIndex (index) {
    if (this.index !== index) {
      this.index = index;
      this.root.dataset.index = index;
      this.root.style.transform = `translateY(${index * ROW_HEIGHT}px)`;
      this.indexEl.textContent = index + 1;
    }
  }

  setValue (value) {
    if (this.value !== value && !this.locked) {
      this.value = value;
      if (this.editable) {
        this.valueInner.value = value;
      } else {
        this.valueInner.textContent = value;
      }
    }
  }

  focus () {
    this.valueInner.click();
    if (document.activeElement !== this.valueInner) {
      setTimeout(() => this.valueInner.click());
    }
  }

  unfocus () {
    if (this.locked) {
      this.locked = false;
      this.valueInner.readOnly = true;
      this.root.classList.remove(styles.monitorRowValueEditing);
    }
  }
}

class ListMonitor extends Monitor {
  constructor (parent, monitor) {
    super(parent, monitor);

    this.editable = parent.editableLists;
    this.rows = new Map();
    this.cachedRows = [];
    this.scrollTop = 0;
    this.oldLength = -1;

    this.label = document.createElement('div');
    this.label.className = styles.monitorListLabel;
    this.label.textContent = this.getLabel();

    this.footer = document.createElement('div');
    this.footer.className = styles.monitorListFooter;

    this.footerText = document.createElement('div');
    this.footerText.className = styles.monitorListFooterText;

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

    if (this.editable) {
      this.addButton = document.createElement('button');
      this.addButton.className = styles.monitorListAdd;
      this.addButton.textContent = '+';
      this.addButton.addEventListener('click', this._onclickaddbutton.bind(this));
      this.footer.appendChild(this.addButton);
    }

    this.rowsInner.appendChild(this.endPoint);
    this.rowsInner.appendChild(this.emptyLabel);
    this.rowsOuter.appendChild(this.rowsInner);
    this.footer.appendChild(this.footerText);
    this.root.appendChild(this.label);
    this.root.appendChild(this.rowsOuter);
    this.root.appendChild(this.footer);

    this.dropper = new DropArea(this.rowsOuter, this.dropperCallback.bind(this));

    this.handleImport = this.handleImport.bind(this);
    this.handleExport = this.handleExport.bind(this);
    this.root.addEventListener('contextmenu', this._oncontextmenu.bind(this));
  }

  _onclickaddbutton (e) {
    this.setValue([...this.value, '']);
    this.tryToFocusRow(this.value.length - 1);
  }

  unfocusAllRows () {
    for (const row of this.rows.values()) {
      row.unfocus();
    }
  }

  tryToFocusRow (index) {
    if (index >= 0 && index < this.value.length) {
      this.unfocusAllRows();
      let row = this.rows.get(index);
      if (!row) {
        row = this.createRow(index);
      }
      row.focus();
    }
  }

  _onscroll (e) {
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
    downloadBlob(`${this.getLabel()}.txt`, blob);
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

  update (monitor) {
    super.update(monitor);

    if (!this.visible) {
      return;
    }

    this.width = monitor.get('width') || 100;
    this.height = monitor.get('height') || 200;
    this.root.style.width = `${this.width}px`;
    this.root.style.height = `${this.height}px`;

    this.updateValue(monitor.get('value'));
  }

  createRow (index) {
    const row = this.cachedRows.pop() || new Row(this);
    row.setIndex(index);
    row.setValue(this.value[index]);
    this.rows.set(index, row);

    let foundPlaceInDOM = false;
    for (const root of this.rowsInner.children) {
      const otherIndexString = root.dataset.index;
      if (!otherIndexString) {
        continue;
      }
      const otherIndexNumber = +otherIndexString;
      if (otherIndexNumber > index) {
        this.rowsInner.insertBefore(row.root, root);
        foundPlaceInDOM = true;
        break;
      }
    }
    if (!foundPlaceInDOM) {
      this.rowsInner.appendChild(row.root);
    }

    return row;
  }

  updateValue (value) {
    this.value = value;

    if (value.length !== this.oldLength) {
      this.oldLength = value.length;
      this.footerText.textContent = this.parent.getMessage('list-length').replace('{n}', value.length);
      this.endPoint.style.transform = `translateY(${value.length * ROW_HEIGHT}px)`;
      this.emptyLabel.style.display = value.length ? 'none' : '';
    }

    let startIndex = Math.floor(this.scrollTop / ROW_HEIGHT) - 5;
    if (startIndex < 0) startIndex = 0;
    let endIndex = Math.ceil((this.scrollTop + this.height) / ROW_HEIGHT) + 3;
    if (endIndex > value.length - 1) endIndex = value.length - 1;

    for (const index of this.rows.keys()) {
      if (index < startIndex || index > endIndex) {
        const row = this.rows.get(index);
        if (!row.locked || index >= value.length) {
          row.unfocus();
          row.root.remove();
          this.rows.delete(index);
          if (this.cachedRows.length < 10) {
            this.cachedRows.push(row);
          }
        }
      }
    }

    for (let i = startIndex; i <= endIndex; i++) {
      const row = this.rows.get(i);
      if (row) {
        row.setValue(value[i]);
      } else {
        this.createRow(i);
      }
    }
  }
}

export {
  VariableMonitor,
  ListMonitor
};

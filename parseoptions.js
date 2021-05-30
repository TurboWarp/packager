/*
Copyright (c) 2020 Thomas Weber

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

window.O = (function() {
  const options = Object.create(null);

  const setOption = (name, value) => {
    // name supports "a.b.c" syntax
    const parts = name.split('.');
    const last = parts.pop();
    let target = options;
    for (const part of parts) {
      if (typeof target[part] === 'undefined') {
        target[part] = Object.create(null);
      }
      target = target[part];
    }
    target[last] = value;
  };

  const onchange = (e) => {
    const target = e.target;
    const name = target.name;
    const value = getValue(target);
    setOption(name, value);
    setLocalValue(name, value);

    if (options.onchange) {
      options.onchange();
    }
  };

  const getValue = (el) => {
    const tag = el.tagName.toLowerCase();

    if (tag === 'select') {
      return el.value;
    }

    if (tag === 'textarea') {
      return el.value;
    }

    if (tag === 'input') {
      switch (el.type) {
      case 'number':
        return +el.value;
      case 'text':
      case 'radio':
      case 'color':
        return el.value;
      case 'checkbox':
        return el.checked;
      case 'file':
        return el.files[0] || null;
      default:
        console.warn('Unknown type', el);
      }
    }
  };

  const setValue = (el, value) => {
    const tag = el.tagName.toLowerCase();

    if (tag === 'select') {
      el.value = value;
    }

    if (tag === 'textarea') {
      el.value = value;
    }

    if (tag === 'input') {
      switch (el.type) {
      case 'text':
      case 'number':
      case 'color':
        el.value = value;
        break;
      case 'radio':
        el.checked = el.value === value;
        break;
      case 'checkbox':
        el.checked = value;
        break;
      default:
        console.warn('Unknown type', el);  
      }
    }
  };

  /**
   * Returns all possible values for an HTML element
   * @returns {string[]|null} list of possible values, or null if all values are possible
   */
  const getPossibleValues = (el) => {
    const tag = el.tagName.toLowerCase();

    if (tag === 'select') {
      return Array.from(el.options).map(i => i.value)
    }

    if (tag === 'input' && el.type === 'radio') {
      return Array.from(document.getElementsByName(el.name)).map(i => i.value);
    }

    return null;
  };

  const setLocalValue = (name, value) => {
    try {
      localStorage.setItem(`opt:${name}`, JSON.stringify(value));
    } catch (e) {
      // ignore
    }
  };

  const getLocalValue = (name) => {
    try {
      const v = localStorage.getItem(`opt:${name}`);
      if (v !== null) {
        return JSON.parse(v);
      }
    } catch (e) {
      // ignore
    }
    return null;
  };

  const inputs = document.querySelectorAll('input, select, textarea');
  for (const input of inputs) {
    const name = input.name;
    if (!name) continue;

    const defaultValue = getValue(input);
    const localValue = getLocalValue(name);
    const possibleValues = getPossibleValues(input);

    let value = defaultValue;
    if (typeof value !== 'object' && localValue !== null && typeof localValue === typeof value) {
      if (possibleValues === null || possibleValues.includes(localValue)) {
        value = localValue;
        setValue(input, value);
      }
    }

    input.addEventListener('change', onchange);

    const isRadio = input.tagName.toLowerCase() === 'input' && input.type === 'radio';
    if (isRadio) {
      if (input.checked) {
        setOption(name, value);
      }
    } else {
      setOption(name, value);
    }
  };

  return options;
}());

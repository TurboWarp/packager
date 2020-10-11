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

window.Conditionals = (function() {
  /** @type {Conditional[]} */
  const conditionals = [];

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion)');

  class Conditional {
    constructor() {
      this._lastVisible = null;
    }

    isVisible() {
      return false;
    }

    onchange(visible) {

    }

    update() {
      const visible = this.isVisible();
      if (visible === this._lastVisible) {
        return;
      }
      this._lastVisible = visible;
      this.onchange(visible);
    }
  }

  class Regular extends Conditional {
    constructor(el) {
      super();
      this.el = el;
    }

    onchange(visible) {
      this.el.hidden = !visible;
    }
  }

  class Animated extends Conditional {
    constructor(el) {
      super();
      this.el = el;
      this.el.style.overflow = 'hidden';
      this.el.style.transition = '.2s';
      this.height = getComputedStyle(el).height;
    }

    onchange(visible) {
      // Because the element isn't actually hidden or removed from the DOM, we have to do some extra work to make sure that
      // inputs and such won't upset accessibility tools or tab index
      if (visible) {
        this.el.style.height = this.height;
        this.el.removeAttribute('aria-hidden');
        for (const input of this.el.querySelectorAll('input')) {
          input.disabled = input._disabled;
          input.tabIndex = input._tabIndex;
        }
      } else {
        this.el.style.height = '0';
        this.el.setAttribute('aria-hidden', 'true');
        for (const input of this.el.querySelectorAll('input')) {
          input._disabled = input.disabled;
          input._tabIndex = input.tabIndex;
          input.tabIndex = -1;
          input.disabled = true;
        }
      }
    }
  }

  const setupConditionals = () => {
    for (const el of document.querySelectorAll('[if]')) {
      const isVisible = new Function('return ' + el.getAttribute('if') + ';');

      let conditional;
      if (el.classList.contains('fold') && !prefersReducedMotion.matches) {
        conditional = new Animated(el);
      } else {
        conditional = new Regular(el);
      }
      conditional.isVisible = isVisible;
      conditionals.push(conditional);
    }

    updateConditionals();
  };

  const updateConditionals = () => {
    for (const i of conditionals) {
      i.update();
    }
  };

  return {
    setup: setupConditionals,
    update: updateConditionals,
  };
})();

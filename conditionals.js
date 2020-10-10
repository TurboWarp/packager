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
    isVisible() {
      return false;
    }

    update() {

    }
  }

  class Regular extends Conditional {
    constructor(el) {
      super();
      this.el = el;
    }

    update() {
      this.el.hidden = !this.isVisible();
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

    update() {
      if (this.isVisible()) {
        this.el.style.height = this.height;
      } else {
        this.el.style.height = `0`;
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

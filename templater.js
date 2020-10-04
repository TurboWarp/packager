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

window.Templater = (function() {
  const conditionals = document.querySelectorAll('[if]');
  for (const el of conditionals) {
    el._condition = new Function('return ' + el.getAttribute('if') + ';');
  }

  const update = () => {
    for (const el of conditionals) {
      el.hidden = !el._condition();
    }
  };

  return {
    update
  };
}());

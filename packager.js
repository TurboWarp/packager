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

const Runtimes = {};

Runtimes.TurboWarp = class TurboWarp {
  async package(projectSource) {
    const res = await fetch('_tw.js');
    const text = await res.text();
    return `<!DOCTYPE html>
<html>

<head>
</head>

<body>

<script>
window.__PROJECT_DATA__ = "${projectSource}";
</script>
<script>
${text.replace(/<\/script>/g,"</scri'+'pt>")}
</script>
</body>

</html>`;
  }
};

const Environments = {};

const readAsDataURL = (blob) => {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject('could not read');
    fr.readAsDataURL(blob);
  });
};

Environments.HTML = class HTML {
  async package(runtime, projectData) {
    const packagerData = await runtime.package(await readAsDataURL(projectData));
    return {
      data: packagerData,
      filename: 'project.html',
    };
  }
};

Environments.Zip = class Zip {
  async package(runtime, projectData) {
    const zip = new JSZip();
    const packagerData = await runtime.package('project.zip');
    zip.file('index.html', packagerData);
    zip.file('project.zip', projectData);
    return {
      data: await zip.generateAsync({ type: 'arraybuffer' })
    }
  }
}
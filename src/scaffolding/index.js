import VM from 'scratch-vm';
import Renderer from 'scratch-render';
import Storage from './storage';
import AudioEngine from 'scratch-audio';
import {BitmapAdapter} from 'scratch-svg-renderer';

import Cloud from './cloud';
import Question from './question';
import {ListMonitor, VariableMonitor} from './monitor';
import styles from './style.css';

class Scaffolding {
  constructor () {
    this.width = 480;
    this.height = 360;

    this._monitors = new Map();
    this._mousedownPosition = null;
    this._draggingId = null;
    this._draggingStartMousePosition = null;
    this._draggingStartSpritePosition = null;
    this._createDOM();

    this._offsetFromTop = 0;
    this._offsetFromBottom = 0;
    this._offsetFromLeft = 0;
    this._offsetFromRight = 0;
  }

  _createDOM () {
    this._root = document.createElement('div');
    this._root.className = styles.root;

    this._layers = document.createElement('div');
    this._layers.className = styles.layers;
    this._root.appendChild(this._layers);

    this._canvas = document.createElement('canvas');
    this._canvas.className = styles.canvas;
    this._addLayer(this._canvas);

    this._overlays = document.createElement('div');
    this._addLayer(this._overlays);

    this._monitorOverlay = document.createElement('div');
    this._monitorOverlay.className = styles.monitorOverlay;
    this._overlays.appendChild(this._monitorOverlay);

    document.addEventListener('mousemove', this._onmousemove.bind(this));
    this._canvas.addEventListener('mousedown', this._onmousedown.bind(this));
    document.addEventListener('mouseup', this._onmouseup.bind(this));
    this._canvas.addEventListener('wheel', this._onwheel.bind(this));
    document.addEventListener('keydown', this._onkeydown.bind(this));
    document.addEventListener('keyup', this._onkeyup.bind(this));
    window.addEventListener('resize', this.resize.bind(this));
  }

  _addLayer (el) {
    this._layers.appendChild(el);
  }

  _scratchCoordinates (x, y) {
    return {
      x: (this.width / this.layersRect.width) * (x - (this.layersRect.width / 2)),
      y: -(this.height / this.layersRect.height) * (y - (this.layersRect.height / 2))
    };
  }

  _onmousemove (e) {
    const data = {
      x: e.clientX - this.layersRect.left,
      y: e.clientY - this.layersRect.top,
      canvasWidth: this.layersRect.width,
      canvasHeight: this.layersRect.height
    };
    if (this._mousedownPosition && !this._draggingId) {
      const distance = Math.sqrt(
        Math.pow(data.x - this._mousedownPosition.x, 2) +
        Math.pow(data.y - this._mousedownPosition.y, 2)
      );
      if (distance > 3) {
        this._startDragging(data.x, data.y);
      }
    } else if (this._draggingId) {
      const position = this._scratchCoordinates(data.x, data.y);
      this.vm.postSpriteInfo({
        x: position.x - this._draggingStartMousePosition.x + this._draggingStartSpritePosition.x,
        y: position.y - this._draggingStartMousePosition.y + this._draggingStartSpritePosition.y,
        force: true
      });
    }
    this.vm.postIOData('mouse', data);
  }

  _startDragging (x, y) {
    if (this._draggingId) return;
    const drawableId = this.renderer.pick(x, y);
    if (drawableId === null) return;
    const targetId = this.vm.getTargetIdForDrawableId(drawableId);
    if (targetId === null) return;
    const target = this.vm.runtime.getTargetById(targetId);
    if (!target.draggable) return;
    this._draggingId = targetId;
    this._draggingStartMousePosition = this._scratchCoordinates(x, y);
    this._draggingStartSpritePosition = {
      x: target.x,
      y: target.y
    };
    this.vm.startDrag(targetId);
  }

  _onmousedown (e) {
    const data = {
      x: e.clientX - this.layersRect.left,
      y: e.clientY - this.layersRect.top,
      canvasWidth: this.layersRect.width,
      canvasHeight: this.layersRect.height,
      isDown: true
    };
    this._mousedownPosition = {
      x: data.x,
      y: data.y
    };
    this.vm.postIOData('mouse', data);
  }

  _onmouseup (e) {
    const data = {
      x: e.clientX - this.layersRect.left,
      y: e.clientY - this.layersRect.top,
      canvasWidth: this.layersRect.width,
      canvasHeight: this.layersRect.height,
      isDown: false
    };
    this._mousedownPosition = null;
    this.vm.postIOData('mouse', data);
    if (this._draggingId) {
      this.vm.stopDrag(this._draggingId);
      this._draggingStartMousePosition = null;
      this._draggingStartSpritePosition = null;
      this._draggingId = null;
    }
  }

  _onwheel (e) {
    const data = {
      deltaX: e.deltaX,
      deltaY: e.deltaY
    };
    this.vm.postIOData('mouseWheel', data);
  }

  _onkeydown (e) {
    if (e.target !== document && e.target !== document.body) {
      return;
    }  
    const data = {
      key: e.key,
      keyCode: e.keyCode,
      isDown: true
    };
    this.vm.postIOData('keyboard', data);
    if (e.keyCode === 32 || (e.keyCode >= 37 && e.keyCode <= 40) || e.keyCode === 8 || e.keyCode === 222 || e.keyCode === 191) {
      e.preventDefault();
    }
  }

  _onkeyup (e) {
    const data = {
      key: e.key,
      keyCode: e.keyCode,
      isDown: false
    };
    this.vm.postIOData('keyboard', data);
    if (e.target !== document && e.target !== document.body) {
      e.preventDefault();
    }  
  }

  _onresize () {
    this.resize();
  }

  resize () {
    const totalWidth = Math.max(1, this._root.offsetWidth);
    const totalHeight = Math.max(1, this._root.offsetHeight);

    const canvasWidth = Math.max(1, totalWidth - this._offsetFromLeft - this._offsetFromRight);
    const canvasHeight = Math.max(1, totalHeight - this._offsetFromTop - this._offsetFromBottom);

    let height = canvasHeight;
    let width = height / this.height * this.width;
    let scale = height / this.height;
    if (width > canvasWidth) {
      scale = canvasWidth / this.width;
      height = canvasWidth / this.width * this.height;
      width = canvasWidth;
    }

    const distanceFromTop = totalHeight - height;
    const distanceFromLeft = totalWidth - width;
    const translateY = (distanceFromLeft - this._offsetFromLeft - this._offsetFromRight) / 2 + this._offsetFromLeft - (distanceFromLeft / 2);
    const translateX = (distanceFromTop - this._offsetFromTop - this._offsetFromBottom) / 2 + this._offsetFromTop - (distanceFromTop / 2);

    this._layers.style.transform = `translate(${translateY}px, ${translateX}px)`;
    this._layers.style.width = `${width}px`;
    this._layers.style.height = `${height}px`;
    this._overlays.style.transform = `scale(${scale})`;
    this.renderer.resize(width, height);

    this.layersRect = this._layers.getBoundingClientRect();
  }

  appendTo (element) {
    element.appendChild(this._root);
    this.resize();
  }

  setup () {
    this.vm = new VM();
    this.vm.setCompatibilityMode(true);
    this.vm.on('MONITORS_UPDATE', this._onmonitorsupdate.bind(this));
    this.vm.runtime.on('QUESTION', this._onquestion.bind(this));

    this.cloudManager = new Cloud.CloudManager(this);

    this.renderer = new Renderer(
      this._canvas,
      -this.width / 2,
      this.width / 2,
      -this.height / 2,
      this.height / 2
    );
    this.vm.attachRenderer(this.renderer);

    this.storage = new Storage();
    this.vm.attachStorage(this.storage);

    this.audioEngine = new AudioEngine();
    this.vm.attachAudioEngine(this.audioEngine);

    this.bitmapAdapter = new BitmapAdapter();
    this.vm.attachV2BitmapAdapter(this.bitmapAdapter);
  }

  _onmonitorsupdate (monitors) {
    for (const monitorData of monitors.valueSeq()) {
      const id = monitorData.get('id');
      if (!this._monitors.has(id)) {
        const visible = monitorData.get('visible');
        if (!visible) {
          // Would be a waste to make it now
          continue;
        }
        // TODO: add to DOM in same order as appears in list
        const mode = monitorData.get('mode');
        if (mode === 'list') {
          this._monitors.set(id, new ListMonitor(this, monitorData));
        } else {
          this._monitors.set(id, new VariableMonitor(this, monitorData));
        }
      }
      const monitorObject = this._monitors.get(id);
      monitorObject.update(monitorData);
    }
  }

  ask (text) {
    this._question = new Question(this, text);
    return this._question.answer();
  }

  _onquestion (question) {
    if (this._question) {
      this._question.destroy()
    }
    if (question !== null) {
      this.ask(question)
        .then((answer) => {
          this.vm.runtime.emit('ANSWER', answer);
        });
    }
  }

  loadProject (data) {
    return this.vm.loadProject(data)
      .then(() => {
        this.vm.setCloudProvider(this.cloudManager);
        this.cloudManager.projectReady();
        this.renderer.draw();
        // Render again after a short delay because some costumes are loaded async
        setTimeout(() => {
          this.renderer.draw();
        });
      });
  }

  setUsername (username) {
    this._username = username;
    this.vm.postIOData('userData', {
      username
    });
  }

  addCloudProvider (provider) {
    this.cloudManager.addProvider(provider);
  }

  addCloudProviderOverride (name, provider) {
    this.cloudManager.addProviderOverride(name, provider);
  }

  start () {
    this.vm.start();
    this.vm.greenFlag();
  }
}

export {
  Scaffolding,
  Cloud,
  VM,
  Renderer,
  Storage,
  AudioEngine
};

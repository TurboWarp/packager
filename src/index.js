import VM from 'scratch-vm';
import Renderer from 'scratch-render';
import Storage from './storage';
import AudioEngine from 'scratch-audio';
import {BitmapAdapter} from 'scratch-svg-renderer';

import Question from './question';
import styles from './style.css';

class Scaffolding {
  constructor () {
    this.width = 480;
    this.height = 360;
    this._createDOM();
  }

  _createDOM () {
    this._root = document.createElement('div');
    this._root.className = styles.root;

    this._layers = document.createElement('div');
    this._layers.className = styles.layers;
    this._root.appendChild(this._layers);

    this._canvas = document.createElement('canvas');
    this._canvas.addEventListener('mousemove', this._onmousemove.bind(this));
    this._canvas.addEventListener('mousedown', this._onmousedown.bind(this));
    this._canvas.addEventListener('mouseup', this._onmouseup.bind(this));
    this._canvas.addEventListener('wheel', this._onwheel.bind(this));
    this._addLayer(this._canvas);

    this._overlays = document.createElement('div');
    this._addLayer(this._overlays);

    document.addEventListener('keydown', this._onkeydown.bind(this));
    document.addEventListener('keyup', this._onkeyup.bind(this));
    window.addEventListener('resize', this._onresize.bind(this));
  }

  _addLayer (el) {
    this._layers.appendChild(el);
  }

  _onmousemove (e) {
    const data = {
      x: e.clientX - this.layersRect.left,
      y: e.clientY - this.layersRect.top,
      canvasWidth: this.layersRect.width,
      canvasHeight: this.layersRect.height
    };
    this.vm.postIOData('mouse', data);
  }

  _onmousedown (e) {
    const data = {
      x: e.clientX - this.layersRect.left,
      y: e.clientY - this.layersRect.top,
      canvasWidth: this.layersRect.width,
      canvasHeight: this.layersRect.height,
      isDown: true
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
    this.vm.postIOData('mouse', data);
  }

  _onwheel (e) {
    const data = {
      deltaX: e.deltaX,
      deltaY: e.deltaY
    };
    this.vm.postIOData('mouseWheel', data);
  }

  _onkeydown (e) {
    const data = {
      key: e.key,
      keyCode: e.keyCode,
      isDown: true
    };
    this.vm.postIOData('keyboard', data);
  }

  _onkeyup (e) {
    const data = {
      key: e.key,
      keyCode: e.keyCode,
      isDown: false
    };
    this.vm.postIOData('keyboard', data);
  }

  _onresize () {
    const totalWidth = this._root.offsetWidth;
    const totalHeight = this._root.offsetHeight;

    let height = totalHeight;
    let width = height / this.height * this.width;
    let scale = height / this.height;
    if (width > totalWidth) {
      scale = totalWidth / this.width;
      height = totalWidth / this.width * this.height;
      width = totalWidth;
    }

    this._layers.style.width = `${width}px`;
    this._layers.style.height = `${height}px`;
    this._overlays.style.transform = `scale(${scale})`;
    this.renderer.resize(width, height);

    this.layersRect = this._layers.getBoundingClientRect();
  }

  appendTo (element) {
    element.appendChild(this._root);
    this._onresize();
  }

  setup () {
    this.vm = new VM();
    this.vm.setCompatibilityMode(true);
    this.vm.runtime.on('QUESTION', this._onquestion.bind(this));

    this._attachRenderer();
    this._attachStorage();
    this._attachAudioEngine();
    this._attachBitmapAdapter();
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

  _attachRenderer () {
    this.renderer = new Renderer(
      this._canvas,
      -this.width / 2,
      this.width / 2,
      -this.height / 2,
      this.height / 2
    );
    this.vm.attachRenderer(this.renderer);
  }

  _attachStorage () {
    this.storage = new Storage();
    this.vm.attachStorage(this.storage);
  }

  _attachAudioEngine () {
    this.audioEngine = new AudioEngine();
    this.vm.attachAudioEngine(this.audioEngine);
  }

  _attachBitmapAdapter () {
    this.bitmapAdapter = new BitmapAdapter();
    this.vm.attachV2BitmapAdapter(this.bitmapAdapter);
  }

  loadProject (data) {
    return this.vm.loadProject(data)
      .then(() => {
        this.renderer.draw();
      });
  }

  start () {
    this.vm.start();
    this.vm.greenFlag();
  }
}

export {
  Scaffolding,
  VM,
  Renderer,
  Storage,
  AudioEngine
};

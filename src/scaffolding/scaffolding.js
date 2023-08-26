import VM from 'scratch-vm';
import Renderer from 'scratch-render';
import Storage from './storage';
import AudioEngine from 'scratch-audio';
import {BitmapAdapter} from 'scratch-svg-renderer';
import JSZip from 'jszip';

import {EventTarget} from '../common/event-target';
import VideoProvider from './video';
import Cloud from './cloud';
import Question from './question';
import {ListMonitor, VariableMonitor} from './monitor';
import ControlBar from './control-bar';
import {isValidListValue, isValidVariableValue} from './verify-value';
import defaultMessages from './messages.json';
import styles from './style.css';

const getEventXY = (e) => {
  if (e.touches && e.touches[0]) {
    return {x: e.touches[0].clientX, y: e.touches[0].clientY};
  } else if (e.changedTouches && e.changedTouches[0]) {
    return {x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY};
  }
  return {x: e.clientX, y: e.clientY};
};

const wrapAsFunctionIfNotFunction = (value) => {
  if (typeof value === 'function') {
    return value;
  }
  return () => value;
};

class Scaffolding extends EventTarget {
  constructor () {
    super();

    this.width = 480;
    this.height = 360;
    this.resizeMode = 'preserve-ratio';
    this.editableLists = false;
    this.shouldConnectPeripherals = true;
    this.usePackagedRuntime = false;

    this.messages = defaultMessages;

    this._monitors = new Map();
    this._mousedownPosition = null;
    this._draggingId = null;
    this._draggingStartMousePosition = null;
    this._draggingStartSpritePosition = null;

    this._offsetFromTop = 0;
    this._offsetFromBottom = 0;
    this._offsetFromLeft = 0;
    this._offsetFromRight = 0;

    this._root = document.createElement('div');
    this._root.className = styles.root;

    this._layers = document.createElement('div');
    this._layers.className = styles.layers;
    this._root.appendChild(this._layers);

    this._canvas = document.createElement('canvas');
    this._canvas.className = styles.canvas;
    this._addLayer(this._canvas);

    this._overlays = document.createElement('div');
    this._overlays.className = styles.scaledOverlaysInner;

    this._overlaysOuter = document.createElement('div');
    this._overlaysOuter.className = styles.scaledOverlaysOuter;

    this._overlaysOuter.appendChild(this._overlays);
    this._addLayer(this._overlaysOuter);

    this._monitorOverlay = document.createElement('div');
    this._monitorOverlay.className = styles.monitorOverlay;
    this._overlays.appendChild(this._monitorOverlay);

    this._topControls = new ControlBar();
    this._layers.appendChild(this._topControls.root);

    document.addEventListener('mousemove', this._onmousemove.bind(this));
    this._canvas.addEventListener('mousedown', this._onmousedown.bind(this));
    document.addEventListener('mouseup', this._onmouseup.bind(this));
    this._canvas.addEventListener('touchstart', this._ontouchstart.bind(this));
    document.addEventListener('touchmove', this._ontouchmove.bind(this));
    document.addEventListener('touchend', this._ontouchend.bind(this));
    this._canvas.addEventListener('contextmenu', this._oncontextmenu.bind(this));
    this._canvas.addEventListener('wheel', this._onwheel.bind(this));
    document.addEventListener('keydown', this._onkeydown.bind(this));
    document.addEventListener('keyup', this._onkeyup.bind(this));
    window.addEventListener('resize', this._onresize.bind(this));
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
    const {x, y} = getEventXY(e);
    const data = {
      x: x - this.layersRect.left,
      y: y - this.layersRect.top,
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
        this._cancelDragTimeout();
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
    target.goToFront();
    this._draggingId = targetId;
    this._draggingStartMousePosition = this._scratchCoordinates(x, y);
    this._draggingStartSpritePosition = {
      x: target.x,
      y: target.y
    };
    this.vm.startDrag(targetId);
  }

  _cancelDragTimeout () {
    clearTimeout(this._dragTimeout);
    this._dragTimeout = null;
  }

  _onmousedown (e) {
    const {x, y} = getEventXY(e);
    const data = {
      x: x - this.layersRect.left,
      y: y - this.layersRect.top,
      button: e.button,
      canvasWidth: this.layersRect.width,
      canvasHeight: this.layersRect.height,
      isDown: true
    };
    const isTouchEvent = typeof TouchEvent !== 'undefined' && e instanceof TouchEvent;
    if (e.button === 0 || isTouchEvent) {
      this._dragTimeout = setTimeout(this._startDragging.bind(this, data.x, data.y), 400);
    }
    if (isTouchEvent) {
      e.preventDefault();
      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
    }
    this._mousedownPosition = {
      x: data.x,
      y: data.y
    };
    this.vm.postIOData('mouse', data);
  }

  _onmouseup (e) {
    this._cancelDragTimeout();
    const {x, y} = getEventXY(e);
    const data = {
      x: x - this.layersRect.left,
      y: y - this.layersRect.top,
      button: e.button,
      canvasWidth: this.layersRect.width,
      canvasHeight: this.layersRect.height,
      isDown: false,
      wasDragged: this._draggingId !== null
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

  _ontouchstart (e) {
    this._onmousedown(e);
  }

  _ontouchmove (e) {
    this._onmousemove(e);
  }

  _ontouchend (e) {
    this._onmouseup(e);
  }

  _oncontextmenu (e) {
    e.preventDefault();
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
    this.relayout();
  }

  relayout () {
    const totalWidth = Math.max(1, this._root.offsetWidth);
    const totalHeight = Math.max(1, this._root.offsetHeight);

    const offsetFromTop = this._offsetFromTop + this._topControls.computeHeight();
    const offsetFromBottom = this._offsetFromBottom;
    const offsetFromLeft = this._offsetFromLeft;
    const offsetFromRight = this._offsetFromRight;

    const projectAreaWidth = Math.max(1, totalWidth - offsetFromLeft - offsetFromRight);
    const projectAreaHeight = Math.max(1, totalHeight - offsetFromTop - offsetFromBottom);

    if (this.resizeMode === 'dynamic-resize') {
      // setStageSize is a TurboWarp-specific method
      if (this.vm.setStageSize) {
        this.width = projectAreaWidth;
        this.height = projectAreaHeight;
        this.vm.setStageSize(this.width, this.height);
      } else {
        console.warn('dynamic-resize not supported: vm does not implement setStageSize');
      }
    }

    let width = projectAreaWidth;
    let height = projectAreaHeight;
    if (this.resizeMode !== 'stretch') {
      width = height / this.height * this.width;
      if (width > projectAreaWidth) {
        height = projectAreaWidth / this.width * this.height;
        width = projectAreaWidth;
      }
    }

    const distanceFromTop = totalHeight - height;
    const distanceFromLeft = totalWidth - width;
    const translateY = (distanceFromLeft - offsetFromLeft - offsetFromRight) / 2 + offsetFromLeft - (distanceFromLeft / 2);
    const translateX = (distanceFromTop - offsetFromTop - offsetFromBottom) / 2 + offsetFromTop - (distanceFromTop / 2);

    this._layers.style.transform = `translate(${translateY}px, ${translateX}px)`;
    this._layers.style.width = `${width}px`;
    this._layers.style.height = `${height}px`;
    this._overlays.style.transform = `scale(${width / this.width}, ${height / this.height})`;
    this.renderer.resize(width, height);

    this.layersRect = this._layers.getBoundingClientRect();
  }

  appendTo (element) {
    element.appendChild(this._root);
    this.relayout();
  }

  setup () {
    this.vm = new VM();
    this.vm.setCompatibilityMode(true);
    this.vm.setLocale(navigator.language);
    this.vm.on('MONITORS_UPDATE', this._onmonitorsupdate.bind(this));
    this.vm.runtime.on('QUESTION', this._onquestion.bind(this));
    this.vm.on('PROJECT_RUN_START', () => this.dispatchEvent(new Event('PROJECT_RUN_START')));
    this.vm.on('PROJECT_RUN_STOP', () => this.dispatchEvent(new Event('PROJECT_RUN_STOP')));

    // TurboWarp-specific VM extensions
    if (this.usePackagedRuntime && this.vm.convertToPackagedRuntime) {
      this.vm.convertToPackagedRuntime();
    }
    if (this.vm.setStageSize) {
      this.vm.setStageSize(this.width, this.height);
    }
    if (this.vm.runtime.cloudOptions) {
      this.vm.runtime.cloudOptions.limit = Infinity;
    }
    // TODO: remove when https://github.com/TurboWarp/packager/issues/213 is fixed
    this.vm.on('STAGE_SIZE_CHANGED', (width, height) => {
      if (this.width !== width || this.height !== height) {
        this.width = width;
        this.height = height;
        this.relayout();
      }
    });

    this.cloudManager = new Cloud.CloudManager(this);

    this.renderer = new Renderer(
      this._canvas,
      -this.width / 2,
      this.width / 2,
      -this.height / 2,
      this.height / 2
    );
    this.vm.attachRenderer(this.renderer);
    // TurboWarp-specific renderer extensions
    if (this.renderer.overlayContainer) {
      this._layers.insertBefore(this.renderer.overlayContainer, this._overlaysOuter);
    }

    this.storage = new Storage();
    this.vm.attachStorage(this.storage);

    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
      this.audioEngine = new AudioEngine();
      this.vm.attachAudioEngine(this.audioEngine);
    } else {
      console.warn('AudioContext not supported. Sound will not work.');
    }

    this.bitmapAdapter = new BitmapAdapter();
    this.vm.attachV2BitmapAdapter(this.bitmapAdapter);

    this.videoProvider = new VideoProvider();
    this.vm.setVideoProvider(this.videoProvider);
  }

  async _connectPeripherals () {
    const scanExtension = (extensionId) => new Promise((resolve) => {
      const onListUpdate = (peripherals) => {
        const peripheralArray = Object.keys(peripherals).map((id) => peripherals[id]);
        if (peripheralArray.length > 0) {
          const peripheral = peripheralArray[0];
          console.log('Connecting to peripheral', peripheral);
          this.vm.connectPeripheral(extensionId, peripheral.peripheralId);
        } else {
          console.error('No peripherals found for', extensionId);
        }
        done();
      };

      const onScanTimeout = () => {
        console.error('Peripheral scan timed out for', extensionId);
        done();
      };

      const done = () => {
        this.vm.removeListener('PERIPHERAL_LIST_UPDATE', onListUpdate);
        this.vm.removeListener('PERIPHERAL_SCAN_TIMEOUT', onScanTimeout);
        resolve();
      };

      this.vm.on('PERIPHERAL_LIST_UPDATE', onListUpdate);
      this.vm.on('PERIPHERAL_SCAN_TIMEOUT', onScanTimeout);
      this.vm.scanForPeripheral(extensionId);
    });

    for (const extensionId of Object.keys(this.vm.runtime.peripheralExtensions)) {
      await scanExtension(extensionId);
    }
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

        if (this.shouldConnectPeripherals) {
          this._connectPeripherals();
        }
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

  addControlButton({element, where}) {
    if (where === 'top-left') {
      this._topControls.addToStart(element);
    } else if (where === 'top-right') {
      this._topControls.addToEnd(element);
    } else {
      throw new Error(`Unknown 'where': ${where}`);
    }
    this.relayout();
  }

  getMessage (id) {
    return this.messages[id] || id;
  }

  /**
   * Change primary accent color.
   * @param {string} color Color in the format #abcdef
   */
  setAccentColor (color) {
    this._root.style.setProperty('--sc-accent-color', color);
    this._root.style.setProperty('--sc-accent-color-transparent', `${color}59`);
  }

  start () {
    this.vm.start();
    this.vm.greenFlag();
  }

  greenFlag () {
    this.start();
  }

  stopAll () {
    this.vm.stopAll();
  }

  _lookupVariable(name, type) {
    const variable = this.vm.runtime.getTargetForStage().lookupVariableByNameAndType(name, type);
    if (!variable) throw new Error(`Global ${type || 'variable'} does not exist: ${name}`);
    return variable;
  }

  setExtensionSecurityManager (newManager) {
    const securityManager = this.vm.extensionManager.securityManager;
    if (!securityManager) {
      console.warn('setExtensionSecurityManager not supported: there is no security manager');
      return;
    }
    for (const [methodName, fn] of Object.entries(newManager)) {
      securityManager[methodName] = wrapAsFunctionIfNotFunction(fn);
    }
  }

  getVariable (name) {
    return this._lookupVariable(name, '').value;
  }

  setVariable(name, value) {
    if (!isValidVariableValue(value)) {
      throw new Error('Invalid variable value');
    }
    this._lookupVariable(name, '').value = value;
  }

  getList(name) {
    return this._lookupVariable(name, 'list').value;
  }

  setList(name, value) {
    if (!isValidListValue(value)) {
      throw new Error('Invalid list value');
    }
    this._lookupVariable(name, 'list').value = value;
  }
}

export {
  Scaffolding,
  Cloud,
  VM,
  Renderer,
  Storage,
  AudioEngine,
  JSZip
};

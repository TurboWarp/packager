const run = ({ scaffolding }) => {
  const canvas = scaffolding._canvas;
  const vm = scaffolding.vm;
  const mouse = vm.runtime.ioDevices.mouse;
  let isLocked = false;

  const postMouseData = (e, isDown) => {
    const {movementX, movementY} = e;
    const {width, height} = scaffolding.layersRect;
    const x = mouse._clientX + movementX;
    const y = mouse._clientY - movementY;
    mouse._clientX = x;
    mouse._scratchX = mouse.runtime.stageWidth * ((x / width) - 0.5);
    mouse._clientY = y;
    mouse._scratchY = mouse.runtime.stageWidth * ((y / height) - 0.5);
    if (typeof isDown === 'boolean') {
      const data = {
        button: e.button,
        isDown
      };
      vm.postIOData('mouse', data);
    }
  };
  document.addEventListener("mousedown", (e) => {
    if (canvas.contains(e.target)) {
      e.stopPropagation();
      if (isLocked) {
        postMouseData(e, true);
      } else {
        canvas.requestPointerLock();
      }
    }
  }, true);
  document.addEventListener("mouseup", (e) => {
    e.stopPropagation();
    if (isLocked) {
      postMouseData(e, false);
    } else if (canvas.contains(e.target)) {
      canvas.requestPointerLock();
    }
  }, true);
  document.addEventListener("mousemove", (e) => {
    e.stopPropagation();
    if (isLocked) {
      postMouseData(e);
    }
  }, true);

  scaffolding.addEventListener('PROJECT_RUN_START', () => {
    if (!isLocked) {
      canvas.requestPointerLock();
    }
  });

  document.addEventListener('pointerlockchange', () => {
    isLocked = document.pointerLockElement === canvas;
  });
  document.addEventListener('pointerlockerror', (e) => {
    console.error('Pointer lock error', e);
  });

  vm.pointerLockMove = (deltaX, deltaY) => {
    postMouseData({
      // Essentially constructing a fake MouseEvent
      movementX: deltaX,
      movementY: deltaY
    });
  };

  const oldStep = vm.runtime._step;
  vm.runtime._step = function (...args) {
    const ret = oldStep.call(this, ...args);
    const {width, height} = scaffolding.layersRect;
    mouse._clientX = width / 2;
    mouse._clientY = height / 2;
    mouse._scratchX = 0;
    mouse._scratchY = 0;
    return ret;
  };
};

export default run;

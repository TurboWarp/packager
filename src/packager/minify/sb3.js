// TODO: Extract this and TurboWarp/scratch-vm's compression to a shared module

// We don't generate new IDs using numbers at this time because their enumeration
// order can affect script execution order as they always come first.
// https://tc39.es/ecma262/#sec-ordinaryownpropertykeys
const SOUP = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!#%()*+,-./:;=?@[]^_`{|}~';
const generateId = i => {
  let str = '';
  while (i >= 0) {
    str = SOUP[i % SOUP.length] + str;
    i = Math.floor(i / SOUP.length) - 1;
  }
  return str;
};

class Pool {
  constructor() {
    this.generatedIds = new Map();
    this.references = new Map();
    this.skippedIds = new Set();
    // IDs in Object.keys(vm.runtime.monitorBlocks._blocks) already have meaning, so make sure to skip those
    // We don't bother listing many here because most would take more than ten million items to be used
    this.skippedIds.add('of');
  }
  skip (id) {
    this.skippedIds.add(id);
  }
  addReference(id) {
    const currentCount = this.references.get(id) || 0;
    this.references.set(id, currentCount + 1);
  }
  generateNewIds() {
    const entries = Array.from(this.references.entries());
    // The most used original IDs should get the shortest new IDs.
    entries.sort((a, b) => b[1] - a[1]);

    let i = 0;
    for (const entry of entries) {
      const oldId = entry[0];

      let newId = generateId(i);
      while (this.skippedIds.has(newId)) {
        i++;
        newId = generateId(i);
      }

      this.generatedIds.set(oldId, newId);
      i++;
    }
  }
  getNewId(originalId) {
    if (this.generatedIds.has(originalId)) {
      return this.generatedIds.get(originalId);
    }
    return originalId;
  }
}

const optimizeSb3Json = (projectData) => {
  // Note: we modify projectData in-place

  // Scan global attributes of the project so we can generate optimal IDs later
  const blockPool = new Pool();

  for (const target of projectData.targets) {
    for (const [blockId, block] of Object.entries(target.blocks)) {
      blockPool.addReference(blockId);
      if (Array.isArray(block)) {
        continue;
      }

      if (block.parent) {
        blockPool.addReference(block.parent);
      }
      if (block.next) {
        blockPool.addReference(block.next);
      }

      for (const input of Object.values(block.inputs)) {
        for (let i = 1; i < input.length; i++) {
          const inputValue = input[i];
          if (typeof inputValue === 'string') {
            blockPool.addReference(inputValue);
          }
        }
      }
    }
  }

  blockPool.generateNewIds();

  if (projectData.monitors) {
    for (const monitor of projectData.monitors) {
      // Remove redundant monitor values
      monitor.value = Array.isArray(monitor.value) ? [] : 0;
    }
  }

  // Use gathered data to optimize the project
  for (const target of projectData.targets) {
    const newBlocks = {};
    const newComments = {};

    for (const [blockId, block] of Object.entries(target.blocks)) {
      newBlocks[blockPool.getNewId(blockId)] = block;
      if (Array.isArray(block)) {
        continue;
      }

      if (block.parent) {
        block.parent = blockPool.getNewId(block.parent);
      }
      if (block.next) {
        block.next = blockPool.getNewId(block.next);
      }

      for (const input of Object.values(block.inputs)) {
        for (let i = 1; i < input.length; i++) {
          const inputValue = input[i];
          if (typeof inputValue === 'string') {
            input[i] = blockPool.getNewId(inputValue);
          }
        }
      }
      if (!block.shadow) {
        delete block.shadow;
      }
      if (!block.topLevel) {
        delete block.topLevel;
      }
      delete block.x;
      delete block.y;
      delete block.comment;
    }
    for (const [commentId, comment] of Object.entries(target.comments)) {
      const text = comment.text;
      const isSpecial = text.includes(' // _twconfig_') || text.includes(' // _gamepad_');
      if (isSpecial) {
        newComments[commentId] = comment;
      }
    }

    target.blocks = newBlocks;
    target.comments = newComments;
  }

  // Remove unnecessary metadata
  if (projectData.meta) {
    delete projectData.meta.agent;
    delete projectData.meta.vm;
  }

  return projectData;
};

export default optimizeSb3Json;

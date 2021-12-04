// Currently, the optimization here is intentionally not optimal
// We had some corruption problems in the past that we are trying to avoid

const SOUP = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#%()*+,-./:;=?@[]^_`{|}~';
const generateId = i => {
  // IDs in Object.keys(vm.runtime.monitorBlocks._blocks) already have meaning, so make sure to skip those
  // We don't bother listing many here because most would take more than ten million items to be used
  if (i > 1309) i++; // of
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
  }
  addReference(id) {
    const currentCount = this.references.get(id) || 0;
    this.references.set(id, currentCount + 1);
  }
  generateNewIds() {
    const entries = Array.from(this.references.entries());
    // The most used original IDs should get the shortest new IDs.
    entries.sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < entries.length; i++) {
      this.generatedIds.set(entries[i][0], generateId(i));
    }
  }
  getNewId(originalId) {
    if (this.generatedIds.has(originalId)) {
      return this.generatedIds.get(originalId);
    }
    throw new Error(`getNewId called with unknown ID ${originalId}`);
  }
}

const BROADCAST_PRIMITIVE = 11;
const VAR_PRIMITIVE = 12;
const LIST_PRIMITIVE = 13;

const optimizeSb3Json = (projectData) => {
  // Note: we modify projectData in-place

  // Scan global attributes of the project so we can generate optimal IDs later
  const variablePool = new Pool();
  const blockPool = new Pool();

  if (projectData.monitors) {
    for (const monitor of projectData.monitors) {
      const monitorOpcode = monitor.opcode;
      if (monitorOpcode === 'data_variable' || monitorOpcode === 'data_listcontents') {
        const monitorId = monitor.id;
        variablePool.addReference(monitorId);
      }
    }
  }

  const scanCompressedNative = native => {
    const type = native[0];
    if (type === VAR_PRIMITIVE || type === LIST_PRIMITIVE) {
      const variableId = native[2];
      variablePool.addReference(variableId);
    } else if (type === BROADCAST_PRIMITIVE) {
      const broadcastId = native[2];
      variablePool.addReference(broadcastId);
    }
  };

  for (const target of projectData.targets) {
    for (const variableId of Object.keys(target.variables)) {
      variablePool.addReference(variableId);
    }
    for (const variableId of Object.keys(target.lists)) {
      variablePool.addReference(variableId);
    }
    for (const broadcastId of Object.keys(target.broadcasts)) {
      variablePool.addReference(broadcastId);
    }

    for (const [blockId, block] of Object.entries(target.blocks)) {
      blockPool.addReference(blockId);
      if (Array.isArray(block)) {
        scanCompressedNative(block);
        continue;
      }

      if (block.parent) {
        blockPool.addReference(block.parent);
      }
      if (block.next) {
        blockPool.addReference(block.next);
      }

      if (block.fields.VARIABLE) {
        variablePool.addReference(block.fields.VARIABLE[1]);
      }
      if (block.fields.LIST) {
        variablePool.addReference(block.fields.LIST[1]);
      }
      if (block.fields.BROADCAST_OPTION) {
        variablePool.addReference(block.fields.BROADCAST_OPTION[1]);
      }

      for (const input of Object.values(block.inputs)) {
        for (let i = 1; i < input.length; i++) {
          const inputValue = input[i];
          if (typeof inputValue === 'string') {
            blockPool.addReference(inputValue);
          } else if (Array.isArray(inputValue)) {
            scanCompressedNative(inputValue);
          }
        }
      }
    }
  }

  variablePool.generateNewIds();
  blockPool.generateNewIds();

  // Use gathered data to optimize the project
  if (projectData.monitors) {
    for (const monitor of projectData.monitors) {
      const monitorOpcode = monitor.opcode;
      if (monitorOpcode === 'data_variable' || monitorOpcode === 'data_listcontents') {
        const monitorId = monitor.id;
        monitor.id = variablePool.getNewId(monitorId);
      }
  
      // Remove redundant monitor values
      monitor.value = Array.isArray(monitor.value) ? [] : 0;
    }
  }

  const optimizeCompressedNative = native => {
    const type = native[0];
    if (type === VAR_PRIMITIVE || type === LIST_PRIMITIVE) {
      const variableId = native[2];
      native[2] = variablePool.getNewId(variableId);
    } else if (type === BROADCAST_PRIMITIVE) {
      const broadcastId = native[2];
      native[2] = variablePool.getNewId(broadcastId);
    }
  };
  for (const target of projectData.targets) {
    const newVariables = {};
    const newLists = {};
    const newBroadcasts = {};
    const newBlocks = {};
    const newComments = {};

    for (const [variableId, variable] of Object.entries(target.variables)) {
      newVariables[variablePool.getNewId(variableId)] = variable;
    }
    for (const [variableId, variable] of Object.entries(target.lists)) {
      newLists[variablePool.getNewId(variableId)] = variable;
    }
    for (const [broadcastId, broadcast] of Object.entries(target.broadcasts)) {
      newBroadcasts[variablePool.getNewId(broadcastId)] = broadcast;
    }

    for (const [blockId, block] of Object.entries(target.blocks)) {
      newBlocks[blockPool.getNewId(blockId)] = block;
      if (Array.isArray(block)) {
        optimizeCompressedNative(block);
        continue;
      }

      if (block.parent) {
        block.parent = blockPool.getNewId(block.parent);
      }
      if (block.next) {
        block.next = blockPool.getNewId(block.next);
      }

      if (block.fields.VARIABLE) {
        block.fields.VARIABLE[1] = variablePool.getNewId(block.fields.VARIABLE[1]);
      }
      if (block.fields.LIST) {
        block.fields.LIST[1] = variablePool.getNewId(block.fields.LIST[1]);
      }
      if (block.fields.BROADCAST_OPTION) {
        block.fields.BROADCAST_OPTION[1] = variablePool.getNewId(block.fields.BROADCAST_OPTION[1]);
      }

      for (const input of Object.values(block.inputs)) {
        for (let i = 1; i < input.length; i++) {
          const inputValue = input[i];
          if (typeof inputValue === 'string') {
            input[i] = blockPool.getNewId(inputValue);
          } else if (Array.isArray(inputValue)) {
            optimizeCompressedNative(inputValue);
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

    target.variables = newVariables;
    target.lists = newLists;
    target.broadcasts = newBroadcasts;
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

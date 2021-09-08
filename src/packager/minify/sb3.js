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
    return originalId;
  }
}

const BROADCAST_PRIMITIVE = 11;
const VAR_PRIMITIVE = 12;
const LIST_PRIMITIVE = 13;

const optimizeSb3Json = (projectData) => {
  // Note: we modify projectData in-place

  const pool = new Pool();

  // Scan the project so that we can generate the most optimal IDs later
  for (const monitor of projectData.monitors) {
    const monitorOpcode = monitor.opcode;
    if (monitorOpcode === 'data_variable' || monitorOpcode === 'data_listcontents') {
      const monitorId = monitor.id;
      pool.addReference(monitorId);
    }
  }
  const scanCompressedNative = native => {
    const type = native[0];
    if (type === VAR_PRIMITIVE || type === LIST_PRIMITIVE) {
      const variableId = native[2];
      pool.addReference(variableId);
    } else if (type === BROADCAST_PRIMITIVE) {
      const broadcastId = native[2];
      pool.addReference(broadcastId);
    }
  };
  for (const target of projectData.targets) {
    for (const variableId of Object.keys(target.variables)) {
      pool.addReference(variableId);
    }
    for (const variableId of Object.keys(target.lists)) {
      pool.addReference(variableId);
    }
    for (const broadcastId of Object.keys(target.broadcasts)) {
      pool.addReference(broadcastId);
    }
    for (const [blockId, block] of Object.entries(target.blocks)) {
      pool.addReference(blockId);
      if (Array.isArray(block)) {
        scanCompressedNative(block);
        continue;
      }
      if (block.parent) {
        pool.addReference(block.parent);
      }
      if (block.next) {
        pool.addReference(block.next);
      }
      if (block.fields.VARIABLE) {
        pool.addReference(block.fields.VARIABLE[1]);
      }
      if (block.fields.LIST) {
        pool.addReference(block.fields.LIST[1]);
      }
      if (block.fields.BROADCAST_OPTION) {
        pool.addReference(block.fields.BROADCAST_OPTION[1]);
      }
      for (const input of Object.values(block.inputs)) {
        const inputValue = input[1];
        if (Array.isArray(inputValue)) {
          scanCompressedNative(inputValue);
        } else if (typeof inputValue === 'string') {
          const childBlockId = input[1];
          pool.addReference(childBlockId);
        }
      }
    }
  }

  // Use gathered data to replace old IDs with the new, shorter ones, and apply other optimizations
  pool.generateNewIds();
  for (const monitor of projectData.monitors) {
    const monitorOpcode = monitor.opcode;
    if (monitorOpcode === 'data_variable' || monitorOpcode === 'data_listcontents') {
      const monitorId = monitor.id;
      monitor.id = pool.getNewId(monitorId);
    }
    // Remove redundant monitor values
    monitor.value = Array.isArray(monitor.value) ? [] : 0;
  }
  const optimizeCompressedNative = native => {
    const type = native[0];
    if (type === VAR_PRIMITIVE || type === LIST_PRIMITIVE) {
      const variableId = native[2];
      native[2] = pool.getNewId(variableId);
    } else if (type === BROADCAST_PRIMITIVE) {
      const broadcastId = native[2];
      native[2] = pool.getNewId(broadcastId);
    }
  };
  for (const target of projectData.targets) {
    const newVariables = {};
    const newLists = {};
    const newBroadcasts = {};
    const newBlocks = {};

    for (const [variableId, variable] of Object.entries(target.variables)) {
      newVariables[pool.getNewId(variableId)] = variable;
    }
    for (const [variableId, variable] of Object.entries(target.lists)) {
      newLists[pool.getNewId(variableId)] = variable;
    }
    for (const [broadcastId, broadcast] of Object.entries(target.broadcasts)) {
      newBroadcasts[pool.getNewId(broadcastId)] = broadcast;
    }
    for (const [blockId, block] of Object.entries(target.blocks)) {
      newBlocks[pool.getNewId(blockId)] = block;
      if (Array.isArray(block)) {
        optimizeCompressedNative(block);
        continue;
      }
      if (block.parent) {
        block.parent = pool.getNewId(block.parent);
      }
      if (block.next) {
        block.next = pool.getNewId(block.next);
      }
      if (block.fields.VARIABLE) {
        block.fields.VARIABLE[1] = pool.getNewId(block.fields.VARIABLE[1]);
      }
      if (block.fields.LIST) {
        block.fields.LIST[1] = pool.getNewId(block.fields.LIST[1]);
      }
      if (block.fields.BROADCAST_OPTION) {
        block.fields.BROADCAST_OPTION[1] = pool.getNewId(block.fields.BROADCAST_OPTION[1]);
      }
      for (const input of Object.values(block.inputs)) {
        const inputValue = input[1];
        if (Array.isArray(inputValue)) {
          optimizeCompressedNative(inputValue);
        } else if (typeof inputValue === 'string') {
          const childBlockId = input[1];
          input[1] = pool.getNewId(childBlockId);
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

    target.variables = newVariables;
    target.lists = newLists;
    target.broadcasts = newBroadcasts;
    target.blocks = newBlocks;
    target.comments = {};
  }

  // Step 3 - Remove other unnecessary data
  delete projectData.meta.agent;
  delete projectData.meta.vm;

  return projectData;
};

export default optimizeSb3Json;

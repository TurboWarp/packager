const circularReplacer = () => {
  const seen = new WeakSet();
  return (_, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return Array.isArray(value) ? '[...]' : '{...}';
      }
      seen.add(value);
    }
    return value;
  };
};

const sanitize = (input) => {
  if (typeof input === "object" && input !== null) {
    return JSON.stringify(input, circularReplacer());
  } else {
    return input;
  }
};

const sanitizeVariableType = (input, type) => {
  if (type === "list") {
    return input.map(item => sanitize(item));
  } else {
    return sanitize(input);
  }
};

export default sanitizeVariableType;
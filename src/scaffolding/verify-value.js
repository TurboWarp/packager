export const isValidVariableValue = (value) => (
  typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean'
);

export const isValidListValue = (value) => {
  if (!Array.isArray(value)) return false;
  // Array.prototype.every does not work here because we want to reject arrays with holes eg. new Array(1)
  for (let i = 0; i < value.length; i++) {
    if (!isValidVariableValue(value[i])) return false;
  }
  return true;
};

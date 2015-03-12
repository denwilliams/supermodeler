module.exports = exports = function(value, options, key, attributes) {
  // undefined/null are allowed unless noEmpty
  if (!value && !options.notEmpty) return;

  if (options.notEmpty && !value) {
    return 'is empty';
  }

  if (typeof value === 'string') return;

  return "is not a string";
};

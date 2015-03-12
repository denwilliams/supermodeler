module.exports = exports = function(value, options, key, attributes) {
  // undefined/null are allowed. use presence:true to check for that
  
  switch (typeof value) {
    case 'boolean':
    case 'undefined':
      return;
    default:
      return 'is not boolean';
  }
};

function functionMap(key, fn) {
  var set = setter(key);
  return function(src, dest) {
    set(dest, fn(src));
  };
}

function simpleMap(key) {
  var set = setter(key);
  return function(src, dest) {
    set(dest, src[key]);
  };
}

function complexMap(destKey, srcKey) {
  var set = setter(destKey);
  if (srcKey.indexOf('.') > 0) {
    return nestedMap(destKey, srcKey);
  }
  return function(src, dest) {
    set(dest, src[srcKey]);
  };
}

function nestedMap(destKey, srcKey) {
  var keys = srcKey.split('.');
  var len = keys.length;
  var set = setter(destKey);

  return function(src, dest) {
    var val = src[keys[0]];
    for (i = 1; i < len; i++) {
      val = val[keys[i]];
    }
    set(dest, val);
  };
}

function setter(destKey) {
  if (destKey.indexOf('.') > 0) {
    return nestedSetter(destKey);
  }

  return function (dest, value) {
    dest[destKey] = value;
  };
}

function nestedSetter(destKey) {
  var keys = destKey.split('.');
  var len = keys.length-1;

  return function (dest, value) {
    var val = dest[keys[0]] = dest[keys[0]] || {};
    for (var i = 1; i < len; i++) {
      val = val[keys[i]] = val[keys[i]] || {};
    }

    val[keys[len]] = value;
  };
}



exports.functionMap = functionMap;
exports.simpleMap = simpleMap;
exports.complexMap = complexMap;
exports.nestedMap = nestedMap;

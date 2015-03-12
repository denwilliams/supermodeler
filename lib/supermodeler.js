var mapTypes = require('./map-types');
var validateJs = require('validate.js');
validateJs.validators.string = require('./validators/string');
validateJs.validators.boolean = require('./validators/boolean');
validateJs.validators.array = require('./validators/array');

var Q = require('q');

/**
 * Creates a new modeler instance
 */
function Supermodeler(opts) {
  opts = opts || {};

  this._models = {};
  this._mappers = {};
  this._ValidationError = opts.ValidationError || Error;
}

/**
 * Defines a new model
 * @param  {String} type    [description]
 * @param  {Object} schema  [description]
 * @param  {Object} options [description]
 * @return {Model}          [description]
 */
Supermodeler.prototype.defineModel = function(type, schema, options) {
  var Model = this._compileSchema(schema, options);
  Model.prototype.$type = Model.$type = type;
  this._models[type] = Model;
  return Model;
};

Supermodeler.prototype.defineMap = function(sourceType, targetType, mapRules) {
  var rules = [];
  var def, defType;

  // convert the rule definitions into functions to save parsing multiple times
  for (var key in mapRules) {
    def = mapRules[key];
    defType = typeof def;
    if (defType === 'function') {
      rules.push(mapTypes.functionMap(key, def));
    } else if (defType === 'boolean' && def === true) {
      rules.push(mapTypes.simpleMap(key));
    } else if (defType === 'string') {
      rules.push(mapTypes.complexMap(key, def));
    } else {
      throw new Error('Unsupported rule type: ' + defType);
    }
  }

  this._mappers[sourceType+':'+targetType] = function (src, dest) {
    rules.forEach(function(rule) {
      rule(src, dest);
    });
  };
};

Supermodeler.prototype.get = function(type) {
  var Model = this._models[type];
  if (!Model) throw new Error('No model defined for ' + type);
  return Model;
};

Supermodeler.prototype.create = function(type, initialVals) {
  var Model = this.get(type);
  return new Model(initialVals);
};

Supermodeler.prototype.map = function(source, sourceType, targetType) {
  var self = this;
  if (Q.isPromiseAlike(source)) {
    return Q.when(source).then(function(res) {
      return self.map(res, sourceType, targetType);
    });
  }

  var key = sourceType+':'+targetType;
  var mapper = this._mappers[sourceType+':'+targetType];
  if (typeof mapper !== 'function') throw new Error('Invalid or unknown mapper type: ' + key);

  var Model = this._models[targetType];

  if (Array.isArray(source)) {
    return source.map(function(item) {
      return new Model(item, mapper);
    });
  }

  return new Model(source, mapper);
};

Supermodeler.prototype._map = function(source, Model, mapper) {
  var key = sourceType+':'+targetType;
  var mapper = this._mappers[sourceType+':'+targetType];
  if (typeof mapper !== 'function') throw new Error('Invalid or unknown mapper type: ' + key);

  var Model = this._models[targetType];

  return new Model(source, mapper);
};

Supermodeler.prototype._compileSchema = function(schema) {
  var self = this;
  var props = getProperties(schema.properties || []);
  var rules = schema.validator ? {} : this._buildValidatorRules(schema);
  var validator = schema.validator || this._buildValidator(rules);
  var validate = !!schema.validate;

  var readOnlyProps = schema.properties ?
    schema.properties
      .filter(function(prop) {
        return typeof prop === 'object' && prop.readOnly === true;
      })
      .map(function(prop) {
        return prop.name;
      }) :
    [];

  var subTypes = schema.properties ?
    schema.properties
      .filter(function(prop) {
        return typeof prop === 'object' && prop.type;
      })
      .map(function(prop) {
        return {name: prop.name, type: prop.type};
      }) :
    [];

  var Ctor = function(initialVals, mapper) {
    Object.defineProperties(this, props);
    Object.preventExtensions(this);
    createSubTypes(this, subTypes, initialVals);
    if (initialVals) {
      if (mapper) {
        mapper(initialVals, this);
      } else {
        setInitialValues(this, initialVals);
      }
    }
    setReadOnly(this, readOnlyProps);
    Object.seal(this);

    if (validate) {
      this.$validate();
    }
  };

  Ctor.$rules = rules;
  Ctor.$validate = validator;

  Ctor.prototype.$validate = function() {
    validator(this);
  };

  if (schema.methods) {
    schema.methods.forEach(function(method) {
      Ctor.prototype[method.name] = method.function;
    });
  }

  return Ctor;

  // PRIVATE
  // 
  
  function createSubTypes(obj, subTypes, initialVals) {
    subTypes.forEach(function(t) {
      obj[t.name] = self.create(t.type, initialVals[t.name]);
    });
  }

  function setReadOnly(obj, readOnlyProps) {
    readOnlyProps.forEach(function(prop) {
      Object.defineProperty(obj, prop, {writable:false});
    });
  }

  function setInitialValues(obj, initialVals) {
    for (var prop in initialVals) {
      obj[prop] =  initialVals[prop];
    }
  }

  function getProperties(propArr) {
    var props = {};

    propArr.forEach(function(prop) {
      if (typeof prop === 'string') prop = {name:prop};

      var spec = {
        enumerable: prop.private === undefined ? true : false,
      };

      if (prop.get) {
        // note: we don't allow setters
        spec.get = prop.get;
      } else {
        spec.writable = true;
        spec.value = prop.default;
      }
      props[getPropName(prop.name)] = spec;
    });

    return props;
  }

  function getPropName(fullName) {
    var idx = fullName.indexOf('.');
    if (idx > 0) {
      return fullName.substring(0, idx);
    } else {
      return fullName;
    }
  }
};

Supermodeler.prototype._buildValidatorRules = function(schema) {
  var rules = {};

  schema.properties.forEach(function (property) {
    if (property.validate) {
      rules[property.name] = property.validate;
    }
  });

  return rules;
};

Supermodeler.prototype._buildValidator = function(rules) {
  var self = this;
  return function validate(obj) {
    var results = validateJs(obj, rules);
    if (results) {
      throw new self._ValidationError('Validation failed: ' + getFirstError(results));
    }
  };

  function getFirstError(results) {
    var keys = Object.keys(results);
    return results[keys[0]][0];
  }
};

module.exports = exports = Supermodeler;

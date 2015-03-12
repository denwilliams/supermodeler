var Supermodeler = require('./supermodeler');

exports.Supermodeler = Supermodeler;
exports.create = function (opts) {
  return new Supermodeler(opts);
};

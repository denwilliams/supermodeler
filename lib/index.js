var Supermodeler = require('./supermodeler');

exports.Supermodeler = Supermodeler;
exports.create = function () {
  return new Supermodeler();
};

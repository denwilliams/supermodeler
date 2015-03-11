// uncomment and errors will be thrown
//'use strict';

var modeler = require('../lib').create();

modeler.defineModel('Test', {
  properties: [
    'unset',
    {name:'default', default:'default'},
    {name:'initial'},
    {name:'defaultInitial', default:'default'},
    {name:'readOnly', readOnly:true},
    {name:'readOnlyDefault', readOnly:true, default:'default'},
    {name:'_private', private:true},
    {name:'getter', get:function() { return this.default + this.initial; }}
  ],
  methods: [
    {name:'test', function: function() { console.log('test'); }}
  ]
});

modeler.defineMap('TestTwo', 'Test', {
  default: 'x',
  initial: true,
  defaultInitial: 'z.z',
  readOnly: 'y',
  readOnlyDefault: function(src) { return src.x + src.y; },
});

var model = modeler.create('Test', {
  initial:'initial',
  defaultInitial:'initial',
  _private:'private',
  readOnly:'initial'
});
model.readOnly = 'postSet';
model.readOnlyDefault = 'postSet';

console.log(model);
console.log(model._private);
model.test();
console.log(JSON.stringify(model));

console.log('.......');

var two = {
  x: 'x',
  y: 'y',
  z: {
    z: 'zed'
  },
  initial: 'initialtwo'
};
var mappedModel = modeler.map(two, 'TestTwo', 'Test');

console.log(mappedModel);



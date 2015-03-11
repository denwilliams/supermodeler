// uncomment use strict to throw errors, otherwise things will fail silently
// 'use strict';

var modeler = require('../lib').create();

// alternatively:
// var Supermodeler = new require('../lib').Supermodeler;
// var modeler = new Supermodeler();

// define the models
modeler.defineModel('DbUser', {
  properties: [
    'given_name',
    'surname',
    {name:'user_id', readOnly:true},
    'user_role',
    {name: 'group', type: 'DbGroup'}
  ],
  methods: [
    {name: 'save', function: function() { console.log('saving...'); }}
  ]
});

// models can have submodels... see "group" in DbUser
modeler.defineModel('DbGroup', {
  properties: [
    'id',
    'name'
  ]
});

// the primary intent of the module is to use with domain models
modeler.defineModel('DomainUser', {
  properties: [
    'firstName',
    'lastName',
    'groupId',
    'groupName',
    {name:'userId', readOnly:true},
    {name:'fullName', get:function() { return this.firstName + this.lastName; }},
    {name:'_role', private:true, default:'user'}
  ],
  // you can also define methods that will be set on the prototype
  methods: [
    {name:'print', function: function() { console.log('My name is: ' + this.fullName); }}
  ]
});

modeler.defineModel('ApiUser', {
  properties: [
    'displayName',
    {name:'ids', type:'ApiUserIds'}
  ],
  validate: true
});

modeler.defineModel('ApiUserIds', {
  properties: [
    'user', 'group'
  ],
  validate: true
});




// we can define maps between model types.
// NOTE: the source type does not need to exist as a model, but the target type does
modeler.defineMap('DbUser', 'DomainUser', {
  'firstName': 'given_name',
  'lastName': 'surname',
  'groupId': 'group.id', // we can flatten objects
  'groupName': 'group.name',
  userId: 'user_id',
  _role: 'user_role'
});

modeler.defineMap('DomainUser', 'ApiUser', {
  displayName: function(src) { return src.firstName + ' ' + src.lastName; },
  'ids.user': 'userId', // we can unflatten objects
  'ids.group': 'groupId'
});




// use .create to create a new instance of a model
var dbmodel = modeler.create('DbUser', {
  given_name:'Dennis',
  surname:'Williams',
  user_id:'xyzabcd',
  user_role:'initial',
  group: {
    id: 'id',
    name: 'name'
  }
});

// alternatively we can get the constructor
var DbUser = modeler.get('DbUser');
var dbuser = new DbUser({
  given_name:'Dennis',
  surname:'Williams',
  user_id:'xyzabcd',
  user_role:'initial',
  group: {
    id: 'id',
    name: 'name'
  }
});



// NOTE: user_id is read only, so we can't alter it's value after construction
//... the following will fail
dbmodel.user_id = '9999999';
console.log(dbmodel);
console.log('save', typeof dbmodel.save);
console.log('print', typeof dbmodel.print);
console.log('-------');

var dommodel = modeler.map(dbuser, 'DbUser', 'DomainUser');
console.log(dommodel);
console.log('save', typeof dommodel.save);
console.log('print', typeof dommodel.print);
console.log('-------');

var apimodel = modeler.map(dommodel, 'DomainUser', 'ApiUser');
console.log(apimodel);
console.log('save', typeof dbmodel.save);
console.log('print', typeof dbmodel.print);
console.log('-------');

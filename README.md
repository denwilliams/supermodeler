# Supermodeler

*Node.js Library for creating models, mapping between types and validating model instances.*

There are a lot of NPM modules out there to provide models for database persistence, ORMs, and the like, however there seems to be a shortage of anything targeting more a more generic approach to models.

Supermodeler primarily targets the ability to create domain, or business logic layer models.

In addition it provides easy mapping between model types, and validation of models.





## Defining Models

```js
var definition = {
  properties: [
    'firstName',
    'lastName'
  ],
  methods: [
    getFullName: function() { return this.firstName + ' ' + this.lastName; }
  ]
  validate: true
};
supermodeler.defineModel('User', definition);
```

### Schema

#### "properties"

- *name* - The property or field name.
- *readOnly* - The properties value will not be able to be modified after constructor complete.
- *private* - The property will not be exposed in enumeration, and thus will not show up in serialization or output.
- *type* - Defines this property as being of a sub-type.
- *default* - Default value if none supplied
- *get* - Allows for the definition of a getter
- *validation* - A validate.js validation object

#### Validation Attributes

- **validate** - if true then .validate() will be called on the module before completion of constructor. 
- **validation** - if defined then allows for a customer validator method. Note: *this* will equal the instance on the validation method.


#### "methods"




## Creating Instances

```js
var instance = supermodeler.create('User');
console.log(instance);
// {firstName: undefined, lastName: undefined}

instance = supermodeler.create('User', {firstName:'John', lastName:'Smith'});
console.log(instance);
// {firstName: "John", lastName: "Smith"}

instance = supermodeler.create('User', {firstName:'John'});
console.log(instance);
// {firstName: "John", lastName: undefined}

// Properties not defined on models are either:
// a) Ignored
// b) Throw an error if 'use strict' is defined
instance = supermodeler.create('User', {firstName:'John', gender:'Male'});
console.log(instance);
// {firstName: "John", lastName: undefined}
```




## Mapping

`supermodeler.map(source, sourceType, targetType)`

Source can be either:

- An object of type `sourceType`, in which case map() will return an object of type `targetType`.
- An array of type `sourceType`, in which case map() will return an array of type `targetType`.
- A promise that resolves to either an array or an object as above, in which case map() will return a promise (specifically a Q promise) that resolves with the results mapped to `targetType`.

## Validation

Validation rules are defined on the schema as a `validate` property. See validate.js for available validation rules.

```js
properties: [
  {name: 'name', validate:{presence:true}}
]
```

Each model instance has a `$validate` method on it that can be called to validate the current state of the instance.

```js
var user = supermodeler.create('User');
user.$validate();
```

Also, if the schema has `validate=true` set, then this method will be called in the constructor.
```js
supermodeler.defineModel('User', {properties:['name'], validate:true})
```

Finally, you can validate an anonymous object against the validation rules by calling `$validate` on the Contructor.

```js
var user = {name: 'test'};
var User = supermodeler.get('User');
User.$validate(user);
```

## Example:

See the demo/user.js file for a running version of the following:

```js
// uncomment use strict to throw errors, otherwise things will fail silently
// 'use strict';

var modeler = require('supermodler').create();

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
  displayName: function(src) { return src.firstName + ' ' + src.lastName; }, // use functions for complex maps
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
```
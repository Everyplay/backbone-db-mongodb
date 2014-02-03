## Usage

```js
var MongoDB = require('backbone-db-mongodb');
var Model = require('backbone-promises').Model;
var store = new MongoDB(mongoClient);

var MyModel = Model.extend({
  db: store,
  sync: store.sync,
  mongo_collection: 'mymodels'
});

var a = new MyModel({id:"1", "data":123});

a.save().then(function() {
  var b = new Model({id:1});
  return b.fetch().then(function() {
    console.log(a.get("data"),b.get("data"));
  });
}).otherwise(console.error.bind(console));

```

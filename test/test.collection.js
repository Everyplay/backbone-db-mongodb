var setup = require('./setup');
var assert = require('assert');


describe('Collection tests', function () {
  var collection;
  var model;
  var testId;

  before(function (done) {
    setup.setupDb(function() {
      done();
    });
  });

  after(function (done) {
    setup.clearDb(done);
  });

  it('should .create a model', function () {
    collection = new this.Collection();
    return collection
      .create({
        'id_check': 1
      })
      .then(function (m) {
        model = m;
        assert(m.get('id_check') === collection.at(0).get('id_check'));
      });
  });

  it('should fetch created model', function () {
    var m2 = new this.Model({
      id: model.get(model.idAttribute)
    });
    return m2.fetch()
      .then(function (m) {
      assert(m.get('id_check') === m2.get('id_check'));
    });
  });

  it('should fetch collection models', function () {
    collection = new this.Collection();
    return collection.fetch()
      .then(function (c) {
        assert(collection.length === 1);
        assert(c.at(0));
      });
  });

  it('should remove model from collection', function () {
    testId = model.id;
    return model.destroy();
  });

  it('should check that model was removed', function () {
    collection = new this.Collection();
    return collection.fetch()
      .then(function () {
        var removedModel = collection.where({
          id: testId
        });
        assert(removedModel.length === 0);
      });
  });
});
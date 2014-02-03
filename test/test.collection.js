var assert = require('assert');
var setup = require('./setup');
var MyModel = setup.MyModel;
var MyCollection = setup.MyCollection;

describe('Collection tests', function () {
  var collection;
  var model;
  var testId;

  before(function (done) {
    setup.setupDb(done);
  });

  after(function (done) {
    setup.clearDb(done);
  });

  it('should .create a model', function (done) {
    collection = new this.Collection();
    collection
      .create({
        'id_check': 1
      }, {
        wait: true
      })
      .then(function (m) {
        assert(m.get('id_check') === collection.at(0).get('id_check'));
        model = m;
        done();
      }).otherwise(done);
  });

  it('should fetch created model', function (done) {
    var m2 = new this.Model({
      id: model.id
    });
    m2.fetch().then(function (m) {
      assert(m.get('id_check') === m2.get('id_check'));
      done();
    }).otherwise(done);
  });

  it('should fetch collection models', function (done) {
    collection = new this.Collection();
    collection
      .fetch()
      .then(function (c) {
        assert(collection.length === 1);
        assert(c.at(0));
        done();
      }).otherwise(done);
  });

  it('should remove model from collection', function (done) {
    testId = model.id;
    model
      .destroy()
      .then(function () {
        done();
      }).otherwise(done);
  });

  it('should check that model was removed', function (done) {
    collection = new this.Collection();
    collection
      .fetch()
      .then(function () {
        var removedModel = collection.where({
          id: testId
        });
        assert(removedModel.length === 0);
        done();
      }).otherwise(done);
  });
});
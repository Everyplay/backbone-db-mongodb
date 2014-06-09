var setup = require('./setup');
var assert = require('assert');
var Promised = require('backbone-promises');


describe('MongoDB', function() {
  var id;

  before(function(next) {
    var self = this;
    setup.setupDb(function() {
      self.Model = this.Model;
      self.Collection = this.Collection;
      self.db = this.db;
      next();
    });
  });

  after(function(next) {
    setup.clearDb(next);
  });

  after(function(done) {
    setup.clearDb(done);
  });

  describe('#Model', function() {
    var model;

    it('should .save model with given id', function() {
      var deferred = Promised.when.defer();
      model = new this.Model({
        asd: 'das',
        counter: 2
      });

      model.db.createId(model, {}, function(err) {
        if (err) return deferred.reject(err);
        model.save().then(deferred.resolve);
      });
      return deferred.promise;
    });

    it('should fetch saved model', function() {
      var m2 = new this.Model({
        id: model.get(model.idAttribute)
      });
      return m2.fetch()
        .then(function() {
          assert.equal(m2.get('asd'), 'das');
          assert.equal(m2.get('counter'), 2);
        });
    });

    it('should .save model without id', function() {
      var m = new this.Model({
        data: 'foo',
        counter: 5
      });
      return m.save().then(function(m) {
        id = m.get(m.idAttribute);
      });
    });

    it('should fetch saved model', function() {
      model = new this.Model({
        id: id
      });
      return model.fetch()
        .then(function() {
          assert.equal(model.get('data'), 'foo');
          assert.equal(model.get('counter'), 5);
        });
    });

    it('should update model', function() {
      model.set('data', 'new');
      return model.save();
    });

    it('should fetch updated model', function() {
      model = new this.Model({
        id: id
      });
      return model.fetch()
        .then(function() {
          assert.equal(model.get('data'), 'new');
        });
    });

    it('should inc model attribute', function() {
      model = new this.Model({
        id: id
      });
      return model
        .save(null, {
          inc: {
            attribute: 'counter',
            amount: 1
          }
        });
    });

    it('should check that attribute was increased', function() {
      model = new this.Model({
        id: id
      });
      return model
        .fetch()
        .then(function() {
          assert.equal(model.get('counter'), 6);
          assert.equal(model.get('data'), 'new');
        });
    });

    it('should fail inc operation gracefully with ignoreFailures options', function() {
      var m = new this.Model({
        id: 'foo'
      });
      return m
        .save(null, {
          inc: {
            attribute: 'counter',
            amount: 1
          },
          ignoreFailures: true
        });
    });

    it('should use model.idAttribute as _id but not add it to attributes', function() {
      assert.ok(model.get('_id') === undefined);
    });

    it('should convert _id to ObjectId if it is ObjectId like', function() {
      var m = new this.Model({
        id: '' + model.get(model.idAttribute)
      });
      return m.fetch();
    });
  });
});
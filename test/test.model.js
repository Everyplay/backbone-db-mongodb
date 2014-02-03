var assert = require('assert');
var setup = require('./setup');
var MyModel = setup.MyModel;

describe('MongoDB', function () {
  var id;
  var model;

  before(function (done) {
    var self = this;
    setup.setupDb(done);
  });

  after(function (done) {
    setup.clearDb(done);
  });

  describe('#Model', function () {
    it('should .save model with given id', function (done) {
      var m = new this.Model({
        id: 1,
        asd: 'das',
        counter: 2
      });
      m.save().then(function () {
        done();
      });
    });

    it('should fetch saved model', function (done) {
      var m2 = new this.Model({
        id: 1
      });
      m2
        .fetch()
        .then(function () {
          assert.equal(m2.get('asd'), 'das');
          assert.equal(m2.get('counter'), 2);
          done();
        }, assert).otherwise(done);
    });

    it('should .save model without id', function (done) {
      var m = new this.Model({
        data: 'foo',
        counter: 5
      });
      m.save().then(function (m) {
        id = m.get('id');
        done();
      }).otherwise(done);
    });

    it('should fetch saved model', function (done) {
      model = new this.Model({
        id: id
      });
      model
        .fetch()
        .then(function () {
          assert.equal(model.get('data'), 'foo');
          assert.equal(model.get('counter'), 5);
          done();
        }, assert).otherwise(done);
    });

    it('should update model', function (done) {
      model.set('data', 'new');
      model
        .save()
        .then(function (m) {
          done();
        }).otherwise(done);
    });

    it('should fetch updated model', function (done) {
      model = new this.Model({
        id: id
      });
      model
        .fetch()
        .then(function () {
          assert.equal(model.get('data'), 'new');
          done();
        }, assert).otherwise(done);
    });

    it('should inc model attribute', function (done) {
      model = new this.Model({
        id: id
      });
      model
        .save(null, {
          inc: {
            attribute: 'counter',
            amount: 1
          }
        })
        .then(function (m) {
          done();
        }).otherwise(done);
    });

    it('should check that attribute was increased', function (done) {
      model = new this.Model({
        id: id
      });
      model
        .fetch()
        .then(function () {
          assert.equal(model.get('counter'), 6);
          assert.equal(model.get('data'), 'new');
          done();
        }, assert).otherwise(done);
    });

  });
});
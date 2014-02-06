var assert = require('assert');
var setup = require('./setup');
var MyModel = setup.MyModel;
var MyCollection = setup.MyCollection;
var shared = require('backbone-db/test');

describe('backbone-db tests', function () {
  before(function (next) {
    var self = this;
    setup.setupDb(function () {
      self.Model = this.Model;
      self.Collection = this.Collection;
      self.db = this.db;
      next();
    });
  });

  after(function (next) {
    setup.clearDb(next);
  });

  shared.shouldImplementDb(function () {

  });

});

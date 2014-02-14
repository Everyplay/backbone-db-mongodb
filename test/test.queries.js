var setup = require('./setup');
var assert = require('assert');
var _ = require('lodash');

var inAscendingOrder = function(arr) {
  var inOrder = _.every(arr, function(value, index) {
    return index === 0 || arr[index - 1] <= value;
  });
  return inOrder;
};

var inDescendingOrder = function(arr) {
  var inOrder = _.every(arr, function(value, index) {
    return index === 0 || arr[index - 1] >= value;
  });
  return inOrder;
};

describe('Query tests', function() {
  var testModel;
  var collection;
  var testId;

  before(function(done) {
    setup.setupDb(function() {
      collection = new setup.MyCollection();
      setup.insertFixtureData(collection, done);
    });
  });

  after(function(done) {
    setup.clearDb(function(err) {
      done(err);
    });
  });

  it('should fetch all models', function() {
    return collection
      .fetch()
      .then(function() {
        assert(collection.length === 4);
      });
  });

  it('should fetch matching models filtered with where operator', function() {
    var opts = {
      where: {
        value: 2
      }
    };
    return collection
      .fetch(opts)
      .then(function() {
        assert(collection.length === 2);
        var allHaveCorrectValue = collection.all(function(model) {
          return model.get('value') === 2;
        });
        assert(allHaveCorrectValue);
      });
  });

  it('should filter with multiple where options', function() {
    var opts = {
      where: {
        value: 2,
        name: 'b'
      }
    };
    return collection
      .fetch(opts)
      .then(function() {
        assert(collection.length === 1);
        var allHaveCorrectValue = collection.all(function(model) {
          return model.get('value') === 2 && model.get('name') === 'b';
        });
        assert(allHaveCorrectValue);
      });
  });

  it('should fetch models with limit & offset', function() {
    var opts = {
      limit: 2,
      offset: 1,
    };
    return collection
      .fetch(opts)
      .then(function() {
        assert(collection.length === 2);
        var m = collection.at(0);
        assert(m.get('id') === 2);
      });
  });

  it('should fetch models sorted with value in ascending order', function() {
    var opts = {
      sort: 'value'
    };
    return collection
      .fetch(opts)
      .then(function() {
        assert(collection.length === 4);
        var values = collection.pluck('value');
        assert(inAscendingOrder(values));
      });
  });

  it('should fetch models sorted with value in descending order', function() {
    var opts = {
      sort: '-value'
    };
    return collection
      .fetch(opts)
      .then(function() {
        assert(collection.length === 4);
        var values = collection.pluck('value');
        assert(inDescendingOrder(values));
      });
  });

  it('should fetch collections first page sorted ascending', function() {
    var opts = {
      sort: 'value',
      limit: 2
    };
    return collection
      .fetch(opts)
      .then(function() {
        var values = collection.pluck('value');
        assert(values[0] === 1);
        assert(values[1] === 2);
        testId = collection.at(collection.length - 1).id;
      });
  });

  it('should page through models with after_id', function() {
    var opts = {
      sort: 'value',
      limit: 2,
      after_id: testId
    };
    return collection
      .fetch(opts)
      .then(function() {
        var values = collection.pluck('value');
        assert(values[0] === 2);
        assert(values[1] === 3);
      });
  });

  it('should fetch collections first page sorted descending', function() {
    var opts = {
      sort: '-value',
      limit: 2
    };
    return collection
      .fetch(opts)
      .then(function() {
        var values = collection.pluck('value');
        assert(values[0] === 3);
        assert(values[1] === 2);
        testId = collection.at(0).id;
      });
  });

  it('should page through models with before_id', function() {
    var opts = {
      sort: '-value',
      limit: 2,
      before_id: testId
    };
    return collection
      .fetch(opts)
      .then(function() {
        var values = collection.pluck('value');
        assert(values[0] === 2);
        assert(values[1] === 1);
      });
  });

  it('should fetch models with combined options #1', function() {
    var opts = {
      where: {name: 'c'},
      limit: 2,
      offset: 0,
      sort: 'value'
    };
    return collection
      .fetch(opts)
      .then(function() {
        assert(collection.length === 2);
        var values = collection.pluck('value');
        assert(inAscendingOrder(values));
      });
  });

  it('should fetch models with combined options #2', function() {
    var opts = {
      where: {name: 'c'},
      limit: 2,
      offset: 0,
      sort: '-value'
    };
    return collection
      .fetch(opts)
      .then(function() {
        assert(collection.length === 2);
        var values = collection.pluck('value');
        assert(inDescendingOrder(values));
      });
  });

  it('should fetch models with combined options #3', function() {
    var opts = {
      where: {name: 'c'},
      limit: 2,
      offset: 1,
      sort: 'value'
    };
    return collection
      .fetch(opts)
      .then(function() {
        assert(collection.length === 1);
        var values = collection.pluck('value');
        assert(values[0] === 3);
      });
  });

  it('should fetch models with combined options #4', function() {
    var opts = {
      where: {name: 'c', value: 2},
      limit: 2,
      offset: 0,
      sort: 'value'
    };
    return collection
      .fetch(opts)
      .then(function() {
        assert(collection.length === 1);
        var values = collection.pluck('value');
        assert(values[0] === 2);
      });
  });
});

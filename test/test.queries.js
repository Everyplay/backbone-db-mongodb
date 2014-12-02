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

  it('should sort by multiple properties', function() {
    var opts = {
      sort: ['-value', '-name']
    };
    return collection
      .fetch(opts)
      .then(function() {
        assert.equal(collection.length, 4);
        assert.equal(collection.at(1).id, 4);
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

  it('should page through models with before_id', function() {
    var opts = {
      sort: 'id'
    };
    return collection
      .fetch(opts)
      .then(function() {
        assert(collection.at(0).id === 1);
        assert(collection.at(1).id === 2);
        assert(collection.at(2).id === 3);
        assert(collection.at(3).id === 4);

        return collection.fetch({
          sort: 'id',
          limit: 2,
          before_id: 4
        }).then(function() {
          assert(collection.at(0).id === 2);
          assert(collection.at(1).id === 3);
        });
      });
  });

  it('should page through models with before_id and desc sort', function() {
    var opts = {
      sort: '-id'
    };
    return collection
      .fetch(opts)
      .then(function() {
        assert(collection.at(0).id === 4);
        assert(collection.at(1).id === 3);
        assert(collection.at(2).id === 2);
        assert(collection.at(3).id === 1);

        return collection.fetch({
          sort: '-id',
          limit: 2,
          before_id: 1
        }).then(function() {
          assert(collection.at(0).id === 3);
          assert(collection.at(1).id === 2);
        });
      });
  });

  it('should page through models with after_id', function() {
    var opts = {
      sort: 'id'
    };
    return collection
      .fetch(opts)
      .then(function() {
        assert(collection.at(0).id === 1);
        assert(collection.at(1).id === 2);
        assert(collection.at(2).id === 3);
        assert(collection.at(3).id === 4);

        return collection.fetch({
          sort: 'id',
          limit: 2,
          after_id: 2
        }).then(function() {
          assert(collection.at(0).id === 3);
          assert(collection.at(1).id === 4);
        });
      });
  });

  it('should page through models with after_id and desc sort', function() {
    var opts = {
      sort: '-id'
    };
    return collection
      .fetch(opts)
      .then(function() {
        assert(collection.at(0).id === 4);
        assert(collection.at(1).id === 3);
        assert(collection.at(2).id === 2);
        assert(collection.at(3).id === 1);

        return collection.fetch({
          sort: '-id',
          limit: 2,
          after_id: 3
        }).then(function() {
          assert(collection.at(0).id === 2);
          assert(collection.at(1).id === 1);
        });
      });
  });

  it('should page through models with before_id created_at sort', function() {
    var opts = {
      sort: 'created_at'
    };
    return collection
      .fetch(opts)
      .then(function() {
        assert(collection.at(0).id === 1);
        assert(collection.at(1).id === 2);
        assert(collection.at(2).id === 3);
        assert(collection.at(3).id === 4);

        return collection.fetch({
          sort: 'id',
          limit: 2,
          before_id: 4
        }).then(function() {
          assert(collection.at(0).id === 2);
          assert(collection.at(1).id === 3);
        });
      });
  });

  it('should page through models with before_id and desc created_at sort', function() {
    var opts = {
      sort: '-created_at'
    };
    return collection
      .fetch(opts)
      .then(function() {
        assert(collection.at(0).id === 4);
        assert(collection.at(1).id === 3);
        assert(collection.at(2).id === 2);
        assert(collection.at(3).id === 1);

        return collection.fetch({
          sort: '-created_at',
          limit: 2,
          before_id: 1
        }).then(function() {
          assert(collection.at(0).id === 3);
          assert(collection.at(1).id === 2);
        });
      });
  });

  it('should page through models with after_id created_at sort', function() {
    var opts = {
      sort: 'created_at'
    };
    return collection
      .fetch(opts)
      .then(function() {
        assert(collection.at(0).id === 1);
        assert(collection.at(1).id === 2);
        assert(collection.at(2).id === 3);
        assert(collection.at(3).id === 4);

        return collection.fetch({
          sort: 'created_at',
          limit: 2,
          after_id: 2
        }).then(function() {
          assert(collection.at(0).id === 3);
          assert(collection.at(1).id === 4);
        });
      });
  });

  it('should page through models with after_id and desc created_at sort', function() {
    var opts = {
      sort: '-created_at'
    };
    return collection
      .fetch(opts)
      .then(function() {
        assert(collection.at(0).id === 4);
        assert(collection.at(1).id === 3);
        assert(collection.at(2).id === 2);
        assert(collection.at(3).id === 1);

        return collection.fetch({
          sort: '-created_at',
          limit: 2,
          after_id: 3
        }).then(function() {
          assert(collection.at(0).id === 2);
          assert(collection.at(1).id === 1);
        });
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

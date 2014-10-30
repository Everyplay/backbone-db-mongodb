var _ = require('lodash'),
  Db = require('backbone-db'),
  debug = require('debug')('backbone-db-mongodb'),
  ObjectId = require('mongodb').BSONPure.ObjectID,
  util = require('util');

function MongoDB(client) {
  if (!client) throw new Error('Db.MongoDB requires a connected mongo client');
  this.client = client;
}

function convertSort(sortProp) {
  function _convert(prop) {
    var sortOrder = 1;
    if (prop && prop[0] === '-') {
      sortOrder = -1;
      prop = prop.substr(1);
    }
    var ret = {};
    ret[prop] = sortOrder;
    return ret;
  }
  if (_.isArray(sortProp)) {
    var sortOpts = _.extend.apply(null, [{}].concat(_.map(sortProp, function(prop) {
      return _convert(prop);
    })));
    return sortOpts;
  } else {
    return _convert(sortProp);
  }
}


MongoDB.sync = Db.sync;
_.extend(MongoDB.prototype, Db.prototype, {
  _getCollection: function(model, options, callback) {
    if (options && options.mongo_collection) {
      this.client.collection(options.mongo_collection, callback);
    } else if (model && model.mongo_collection) {
      this.client.collection(model.mongo_collection, callback);
    } else if (model && model.model && model.model.mongo_collection) {
      this.client.collection(model.model.mongo_collection, callback);
    } else {
      throw new Error('Cannot get collection for ' + model.type);
    }
  },

  _filter: function(res, model) {
    var self = this;
    if (Array.isArray(res)) {
      return _.map(res, function(item) {
        return self._filter(item, model);
      });
    }
    var m = model.model || model;
    var idAttr = m.idAttribute || m.prototype.idAttribute;

    if (res && res._id) {
      if (!res[idAttr]) {
        res[idAttr] = res._id;
      }
      delete res._id;
    }
    return res;
  },

  _getId: function(model) {
    var id;

    if (model && model.get) {
      id = model.get(model.idAttribute);
    }
    if (!id) {
      id = model.get('_id');
    }
    if (!id && model) {
      id = model.id || model._id;
    }
    if (typeof id === 'string' && id.length === 24) {
      try {
        id = new ObjectId(id);
      } catch (e) {
        // was not valid ObjectId
      }
    }
    return id;
  },

  findAll: function(model, options, callback) {
    options = options || {};

    if (!model.model && !options.where) {
      debug('fetch model');
      var indexedKeys = _.pluck(model.indexes, 'property');
      var objectKeys = Object.keys(model.attributes);
      var searchAttrs = {};
      _.each(objectKeys, function(attr) {
        if (indexedKeys.indexOf(attr) > -1) {
          searchAttrs[attr] = model.get(attr);
        }
      });
      if (!Object.keys(searchAttrs).length) {
        var errMsg = util.format('Cannot fetch model %s with given attributes %s', model.type, JSON.stringify(searchAttrs));
        var err = new Error(errMsg);
        return callback(err);
      }

      options.where = searchAttrs;
    }
    var self = this;
    var query = options.where || {};
    var offset = options.offset || 0;
    var limit = options.limit || this.limit || 50;
    var sort = options.sort ? convertSort(options.sort) : false;
    var projection;
    if (options.fields) {
      projection = {};
      _.each(options.fields, function(field) {
        projection[field] = 1;
      });
    }

    if (options.after_id) {
      query._id = {
        $gt: options.after_id
      };
    } else if (options.before_id) {
      query._id = {
        $lt: options.before_id
      };
    }
    if (query.id) {
      query._id = query.id;
      delete query.id;
    }

    debug('findAll %s: limit: %s, offset: %s, sort: %s, projection: %s',
      JSON.stringify(query),
      limit,
      offset,
      JSON.stringify(sort),
      projection
    );
    this._getCollection(model, options, function(err, collection) {
      if (err) return callback(err);
      var q = collection
        .find(query, {fields: projection})
        .skip(offset)
        .limit(limit);
      if (sort) {
        q.sort(sort);
      }
      q.toArray(function(err, results) {
        if (!model.model) {
          if (!results || results.length === 0) {
            var errorMsg = util.format('%s (%s) not found (read)', model.type, model.id);
            err = err || new Db.errors.NotFoundError(errorMsg);
          } else {
            results = self._filter(results, model);
          }
          return callback(err, results && results.length && results[0]);
        }
        if (err || !results) return callback(err, results);
        results = self._filter(results, model);
        callback(null, results);
      });
    });
  },

  find: function(model, options, callback) {
    options = options || {};
    var self = this;
    var query = options.where || {
      _id: this._getId(model)
    };

    debug('find %s', JSON.stringify(query));
    this._getCollection(model, options, function(err, col) {
      if (err) return callback(err);
      col.findOne(query, function(err, res) {
        if (err) return callback(err);
        res = self._filter(res, model);
        return callback(err, res);
      });
    });
  },

  create: function(model, options, callback) {
    var self = this;
    if (model.isNew()) {
      this.createId(model, options, function(err) {
        debug('create: %s', model.id);
        if (err) callback(err);
        self.update(model, options, callback);
      });
    } else {
      self.update(model, options, callback);
    }
  },

  createId: function(model, options, callback) {
    debug('createId');
    var createIdFn = model.createId ? model.createId.bind(model) : this._createDefaultId;
    createIdFn(function(err, id) {
      model.set(model.idAttribute, id);
      callback(err);
    });
  },

  _createDefaultId: function(callback) {
    callback(null, new ObjectId());
  },

  update: function(model, options, callback) {
    var self = this;
    if (model.isNew()) {
      return this.create(model, options, callback);
    }
    if (options.inc) {
      return this.inc(model, options, callback);
    }
    debug('update: %s %s', model.type, model.id);
    this._getCollection(model, options, function(err, collection) {
      if (err) return callback(err);
      var data = model.toJSON(options);
      var id = data._id || data[model.idAttribute];
      delete data._id;
      collection.update({
        _id: id
      }, {
        '$set': data
      }, {
        upsert: true,
        multi: false
      }, function(err, res) {
        if (id && model.idAttribute === '_id') {
          data._id = id;
        }
        callback(err, data, res);
      });
    });
  },

  destroy: function(model, options, callback) {
    var self = this;
    debug('destroy %s', model.get(model.idAttribute));
    if (model.isNew()) {
      return false;
    }

    this._getCollection(model, options, function(err, collection) {
      if (err) return callback(err);
      collection.remove({
        _id: self._getId(model)
      }, function(err, res) {
        callback(err, res || options.ignoreFailures ? 1 : res);
      });
    });
  },

  inc: function(model, options, callback) {
    if (!options || !options.inc || !options.inc.attribute) {
      throw new Error('inc settings must be defined');
    }
    var self = this;
    var attribute = options.inc.attribute;
    var amount = options.inc.amount || 1;
    var inc = {};
    inc[attribute] = amount;
    debug('inc:' + JSON.stringify(inc));
    this._getCollection(model, options, function(err, col) {
      if (err) return callback(err);
      col.update({
          _id: self._getId(model)
        }, {
          $inc: inc
        }, {
          upsert: options.upsert || false
        },
        function(err, res) {

          callback(err, res || options.ignoreFailures ? 1 : res);
        }
      );
    });
  }
});

module.exports = Db.MongoDB = MongoDB;
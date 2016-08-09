/*!
    Copyright (C) 2016 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/
(function ($, can) {
  // a few core CanJS extensions below.
  // Core validation for fields not being "blank", i.e.
  // having no content when outside spaces are trimmed away.
  can.Model.validationMessages.non_blank =
    can.Map.validationMessages.non_blank = 'cannot be blank';

  can.Model.validateNonBlank =
    can.Map.validateNonBlank = function (attrNames, options) {
      this.validate(attrNames, options, function (value) {
        if (_.isUndefined(value) ||
            _.isNull(value) ||
            _.isFunction(value.trim) && value.trim() === '') {
          return this.constructor.validationMessages.non_blank;
        }
      });
    };
  can.Model.validateContact =
    can.Map.validateContact = function (attrNames, options) {
      this.validate(attrNames, options, function (newVal, prop) {
        var reifiedContact = this.contact ? this.contact.reify() : false;
        var hasEmail = reifiedContact ? reifiedContact.email : false;

        // This check will not work until the bug introduced with commit 8a5f600c65b7b45fd34bf8a7631961a6d5a19638
        // is resolved.
        if (!hasEmail) {
          return 'No valid contact selected for assignee';
        }
      });
    };

  /**
   * Validate an autocomplete list field to be not blank.
   *
   * It checks in the field contains either a false-value, or a
   * non-constructor, or a constructor that builds an empty object and if so,
   * returns a non_blank error message.
   *
   * @param {String} listFieldName - the name of the field with the
   * autocomplete list
   * @param {Function} condition - a zero-parameter function; the validation
   * will be fired only if condition returns true or is undefined
   * @param {Object} options - a CanJS options argument passed to CanJS
   * validate function
   *
   */
  can.Model.validateListNonBlank =
    can.Map.validateListNonBlank = function (listFieldName, condition,
                                             options) {
      this.validate(listFieldName, options, function (newVal, prop) {
        if (_.isUndefined(condition) || condition.call(this)) {
          if (!newVal ||
              !_.isFunction(newVal.attr) ||
              _.isEmpty(newVal.attr())) {
            return this.constructor.validationMessages.non_blank;
          }
        }
      });
    };

  // Adding reduce, a generally useful array comprehension.
  //  Bitovi decided against including it in core CanJS, but
  //  adding it here for easy universal use across can.List
  //  as well as arrays.
  if (!can.reduce) {
    can.reduce = function (a, f, i) {
      if (_.isNull(a)) {
        return null;
      }
      return [].reduce.apply(a, arguments.length < 3 ? [f] : [f, i]);
    };
  }

  // Turn camelSpace strings into Camel Space strings
  can.spaceCamelCase = function (string) {
    return can.underscore(string)
      .split('_')
      .map(can.capitalize)
      .join(' ');
  };
  can.camelCaseToUnderscore = function (string) {
    return string.replace(/([A-Z])/g, '_$1').toLowerCase();
  };
  can.camelCaseToDashCase = function (string) {
    if (!_.isString(string)) {
      return '';
    }
    return string.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  };

    can.Observe.prototype.stub = function() {
    if (!(this instanceof can.Model || this instanceof can.Stub))
      console.debug('.stub() called on non-stub, non-instance object', this);

    var type, id, stub;

    if (this instanceof can.Stub) {
      return this;
    }

    if (this instanceof can.Model) {
      type = this.constructor.shortName;
    } else {
      type = this.type;
    }

    if (this.constructor.id) {
      id = this[this.constructor.id];
    } else {
      id = this.id;
    }

    if (!id && id !== 0) {
      return null;
    }

    return can.Stub.get_or_create({
      id: id,
      href: this.selfLink || this.href,
      type: type
    });
  };

  can.Observe('can.Stub', {
    get_or_create: function (obj) {
      var id = obj.id;
      var stub;
      var type = obj.type;

      CMS.Models.stub_cache = CMS.Models.stub_cache || {};
      CMS.Models.stub_cache[type] = CMS.Models.stub_cache[type] || {};
      if (!CMS.Models.stub_cache[type][id]) {
        stub = new can.Stub(obj);
        CMS.Models.stub_cache[type][id] = stub;
      }
      return CMS.Models.stub_cache[type][id];
    }
  }, {
    init: function () {
      var that = this;
      this._super.apply(this, arguments);
      this._instance().bind('destroyed', function (ev) {
        // Trigger propagating `change` event to convey `stub-destroyed` message
        can.trigger(
          that, 'change', ['stub_destroyed', 'stub_destroyed', that, null]);
        delete CMS.Models.stub_cache[that.type][that.id];
      });
    },

    _model: function () {
      return CMS.Models[this.type] || GGRC.Models[this.type];
    },

    _instance: function () {
      if (!this.__instance) {
        this.__instance = this._model().model(this);
      }
      return this.__instance;
    }
  });

  can.Observe.List.prototype.stubs = function () {
    return new can.Observe.List(can.map(this, function (obj) {
      return obj.stub();
    }));
  };

  can.Observe.prototype.reify = function () {
    var type, model;

    if (this instanceof can.Model) {
      return this;
    }
    if (!(this instanceof can.Stub)) {
      console.debug('`reify()` called on non-stub, non-instance object', this);
    }

    type = this.type;
    model = CMS.Models[type] || GGRC.Models[type];

    if (!model) {
      console.debug('`reify()` called with unrecognized type', this);
    } else {
      return model.model(this);
    }
  };

  can.Observe.List.prototype.reify = function () {
    return new can.Observe.List(can.map(this, function (obj) {
      return obj.reify();
    }));
  };
})(jQuery, can);

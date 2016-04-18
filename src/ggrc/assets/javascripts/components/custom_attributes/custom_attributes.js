/*!
    Copyright (C) 2014 Google Inc., authors, and contributors <see AUTHORS file>
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
    Created By: anze@reciprocitylabs.com
    Maintained By: anze@reciprocitylabs.com
*/

(function (can, $) {
  GGRC.Components('customAttributes', {
    tag: 'custom-attributes',
    content: '<content/>',
    scope: {
      instance: null,
      // Make sure custom_attribute_definitions & custom_attribute_values
      // get loaded
      load: '@',
      loading: false,
      caList: function () {
        var instance = this.attr('instance');
        var definitions = instance.custom_attribute_definitions || [];
        var values = instance.custom_attribute_values || [];
        var result = can.map(definitions, function (def) {
          def = def.reify();
          return can.map(values, function (ca) {
            var response = {};
            ca = ca.reify();

            if (ca.custom_attribute_id !== def.id) {
              return;
            }

            response.attribute_type = def.attribute_type;
            response.title = def.title;
            response.id = ca.id;

            if (ca.attribute_value) {
              response.attribute_value = ca.attribute_value;
            }
            if (ca.attribute_object) {
              response.attribute_object = ca.attribute_object.reify();
            }
            if (response.attribute_value || response.attribute_object) {
              return response;
            }
          });
        });

        return _.compact(_.flattenDeep(result));
      },
      refreshAttributes: function () {
        this.attr('loading', true);
        $.when(
          this.instance.load_custom_attribute_definitions(),
          this.instance.refresh_all('custom_attribute_values')
            .then(function (values) {
              var rq = new RefreshQueue();
              _.each(values, function (value) {
                if (value.attribute_object) {
                  rq.enqueue(value.attribute_object);
                }
              });
              return rq.trigger();
            })
        ).always(function () {
          this.attr('loading', false);
        }.bind(this));
      }
    },
    events: {
      '{scope.instance} updated': function () {
        this.scope.refreshAttributes();
      }
    },
    init: function () {
      if (!this.scope.instance.class.is_custom_attributable) {
        return;
      }
      if (this.scope.load) {
        this.scope.refreshAttributes();
      }
    },
    helpers: {
      with_value_for_id: function (id, options) {
        var ret;
        id = Mustache.resolve(id);
        can.each(this.instance.custom_attribute_values, function (value) {
          value = value.reify();
          if (value.custom_attribute_id === id) {
            ret = value.attribute_value;
          }
        });
        return options.fn(options.contexts.add({
          value: ret
        }));
      },
      with_object_for_id: function (id, options) {
        var ret;
        id = Mustache.resolve(id);
        can.each(this.instance.custom_attribute_values, function (value) {
          value = value.reify();
          if (value.custom_attribute_id === id) {
            ret = value.attribute_object;
            if (ret) {
              ret = ret.reify();
            }
          }
        });
        return options.fn(options.contexts.add({
          object: ret
        }));
      }
    }
  });
})(window.can, window.can.$);

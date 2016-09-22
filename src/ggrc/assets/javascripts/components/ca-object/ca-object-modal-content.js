/*!
 Copyright (C) 2016 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (can, GGRC) {
  'use strict';

  var tpl = can.view(GGRC.mustache_path +
    '/components/ca-object/ca-object-modal-content.mustache');

  GGRC.Components('customAttributeObjectModalContent', {
    tag: 'ca-object-modal-content',
    template: tpl,
    scope: {
      instance: null,
      content: {
        title: null,
        value: null,
        type: null
      },
      caIds: null
    },
    helpers: {
      renderFieldValue: function (value) {
        value = Mustache.resolve(value);
        return value || '<span class="empty-message">None</span>';
      }
    }
  });
})(window.can, window.GGRC);

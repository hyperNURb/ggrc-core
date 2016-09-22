/*!
 Copyright (C) 2016 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

(function (GGRC, can) {
  'use strict';

  var tag = 'assessment-attachments-list';
  var template = can.view(GGRC.mustache_path +
    '/components/assessment/attachments-list.mustache');

  /**
   * Wrapper Component for rendering and managing of attachments lists
   */
  GGRC.Components('assessmentAttachmentsList', {
    tag: tag,
    template: template,
    scope: {
      instance: null
    },
    helpers: {
      showNotification: function (options) {
        var instance = this.instance;
        var binding = instance.class.info_pane_options.evidence.mapping;
        var mapping = instance.get_mapping(binding);

        if (instance._mandatory_attachment_msg &&
            mapping.length < instance._mandatory_attachment_count) {
          return options.fn(options.contexts);
        }
        return options.inverse();
      }
    }
  });
})(window.GGRC, window.can);


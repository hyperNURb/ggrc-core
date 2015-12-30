/*!
    Copyright (C) 2013 Google Inc., authors, and contributors <see AUTHORS file>
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
    Created By: dan@reciprocitylabs.com
    Maintained By: brad@reciprocitylabs.com
*/

(function ($) {
  'use strict';
  var handlers;
  var arrangeBackgroundModals;
  var arrangeTopModal;
  var _modal_show;
  var _modal_hide;
  var reconfigureModals;

  function preload_content() {
    var template = ['<div class="modal-header">',
      '  <a class="pull-right modal-dismiss" href="#" data-dismiss="modal">',
      '    <i class="grcicon-x-grey"></i>',
      '  </a>',
      '  <h2>Loading...</h2>',
      '</div>',
      '<div class="modal-body" style="padding-top:150px;"></div>',
      '<div class="modal-footer">',
      '</div>'];

    return $(template.join('\n'))
      .filter('.modal-body')
        .html(
          $(new Spinner().spin().el)
            .css({
              width: '100px', height: '100px',
              left: '50%', top: '50%',
              zIndex: calculate_spinner_z_index
            })
        ).end();
  }

  function emit_loaded(responseText, textStatus, xhr) {
    if (xhr.status === 403) {
      // For now, only inject the response HTML in the case
      // of an authorization error
      $(this).html(responseText);
    }
    $(this).trigger('loaded');
  }

  function refresh_page() {
    setTimeout(can.proxy(GGRC.navigate, GGRC), 10);
  }

  handlers = {
    modal: function ($target, $trigger, option) {
      $target.modal(option).draggable({handle: '.modal-header'});
    },
    listform: function ($target, $trigger, option) {
      var list_target = $trigger.data('list-target');
      $target.modal_relationship_selector(option, $trigger);

      // Close the modal and rewrite the target list
      $target.on('ajax:json', function (e, data, xhr) {
        if (data.errors) {
        } else if (list_target === 'refresh') {
          refresh_page();
        } else if (list_target) {
          $(list_target).tmpl_setitems(data);
          $target.modal_relationship_selector('hide');
        }
      });
    },
    listnewform: function ($target, $trigger, option) {
      var list_target = $trigger.data('list-target');
      var selector_target = $trigger.data('selector-target');

      $target.modal_form(option, $trigger);

      // Close the modal and append to the target list
      $target.on('ajax:json', function (e, data, xhr) {
        if (data.errors) {
        } else {
          if (list_target) {
            $(list_target).tmpl_additem(data);
          }
          if (selector_target) {
            $(selector_target).trigger('list-add-item', data);
          }
          $target.modal_form('hide');
        }
      });
    },
    listeditform: function ($target, $trigger, option) {
      var list_target = $trigger.data('list-target');
      var selector_target = $trigger.data('selector-target');

      $target.modal_form(option, $trigger);

      // Close the modal and append to the target list
      $target.on('ajax:json', function (e, data, xhr) {
        if (!data.errors) {
          if (list_target) {
            $(list_target).tmpl_mergeitems([data]);
          }
          if (selector_target) {
            $(selector_target).trigger('list-update-item', data);
          }
          $target.modal_form('hide');
          $trigger.trigger('modal:success', data);
        }
      });
    },
    deleteform: function ($target, $trigger, option) {
      var model = CMS.Models[$trigger.attr('data-object-singular')];
      var instance;
      var delete_counts = new can.Observe({loading: true, counts: ''});

      if ($trigger.attr('data-object-id') === 'page') {
        instance = GGRC.page_instance();
      } else {
        instance = model.findInCacheById($trigger.attr('data-object-id'));
      }

      instance.get_orphaned_count().done(function (counts) {
        delete_counts.attr('loading', false);
        delete_counts.attr('counts', counts);
      }).fail(function () {
        delete_counts.attr('loading', false);
      });

      $target
      .modal_form(option, $trigger)
      .ggrc_controllers_delete({
        $trigger: $trigger,
        skip_refresh: !$trigger.data('refresh'),
        new_object_form: false,
        button_view: GGRC.mustache_path +
          '/modals/delete_cancel_buttons.mustache',
        model: model,
        instance: instance,
        delete_counts: delete_counts,
        modal_title: 'Delete ' + $trigger.attr('data-object-singular'),
        content_view: GGRC.mustache_path +
          '/base_objects/confirm_delete.mustache'
      });

      $target.on('modal:success', function (e, data) {
        var model_name = $trigger.attr('data-object-plural').toLowerCase();
        if ($trigger.attr('data-object-id') === 'page' ||
            (instance === GGRC.page_instance())) {
          GGRC.navigate('/dashboard');
        } else if (model_name === 'people' || model_name === 'roles') {
          window.location.assign('/admin#' + model_name + '_list_widget');
          GGRC.navigate();
        } else {
          $trigger.trigger('modal:success', data);
          $target.modal_form('hide');
        }
      });
    },
    unmapform: function ($target, $trigger, option) {
      var object_params = $trigger.attr('data-object-params');
      var model = CMS.Models[$trigger.attr('data-object-singular')];
      var instance;

      if ($trigger.attr('data-object-id') === 'page') {
        instance = GGRC.page_instance();
      } else {
        instance = model.findInCacheById($trigger.attr('data-object-id'));
      }
      if (object_params) {
        object_params = JSON.parse(object_params.replace(/\\n/g, '\n'));
      } else {
        object_params = {};
      }

      $target
      .modal_form(option, $trigger)
      .ggrc_controllers_unmap({
        $trigger: $trigger,
        new_object_form: false,
        button_view: GGRC.mustache_path +
          '/modals/unmap_cancel_buttons.mustache',
        model: model,
        instance: instance,
        object_params: object_params,
        modal_title: $trigger.attr('data-modal-title') ||
          ('Delete ' + $trigger.attr('data-object-singular')),
        content_view: $trigger.attr('data-content-view') ||
          (GGRC.mustache_path + '/base_objects/confirm_unmap.mustache')
      });

      $target.on('modal:success', function (e, data) {
        $trigger.children('.result').each(function (i, result_el) {
          var $result_el = $(result_el);
          var result = $result_el.data('result');
          var mappings = result && result.get_mappings();

          can.each(mappings, function (mapping) {
            mapping.refresh().done(function () {
              if (mapping instanceof CMS.Models.Control) {
                mapping.removeAttr('directive');
                mapping.save();
              } else {
                mapping.destroy();
              }
            });
          });
        });
      });
    },
    form: function ($target, $trigger, option) {
      var form_target = $trigger.data('form-target');
      var object_params = $trigger.attr('data-object-params');
      var model = CMS.Models[$trigger.attr('data-object-singular')] ||
        CMS.ModelHelpers[$trigger.attr('data-object-singular')];
      var mapping = $trigger.data('mapping');
      var instance;
      var modal_title;
      var title_override;
      var content_view;

      if ($trigger.attr('data-object-id') === 'page') {
        instance = GGRC.page_instance();
      } else {
        instance = model.findInCacheById($trigger.attr('data-object-id'));
      }
      if (object_params) {
        object_params = JSON.parse(object_params.replace(/\\n/g, '\n'));
      } else {
        object_params = {};
      }

      modal_title = (instance ? 'Edit ' : 'New ') +
        ($trigger.attr('data-object-singular-override') ||
          model.title_singular || $trigger.attr('data-object-singular'));

      // If this was initiated via quick join link
      if (object_params.section) {
        modal_title = 'Map ' + modal_title + ' to ' +
          object_params.section.title;
      }
      title_override = $trigger.attr('data-modal-title-override');
      if (title_override) {
        modal_title = title_override;
      }

      content_view = $trigger.data('template') ||
        GGRC.mustache_path + '/' + $trigger.attr('data-object-plural') +
        '/modal_content.mustache';

      $target
      .modal_form(option, $trigger)
      .ggrc_controllers_modals({
        new_object_form: !$trigger.attr('data-object-id'),
        object_params: object_params,
        button_view: GGRC.Controllers.Modals.BUTTON_VIEW_SAVE_CANCEL_DELETE,
        model: model,
        current_user: GGRC.current_user,
        instance: instance,
        modal_title: object_params.modal_title || modal_title,
        content_view: content_view,
        mapping: mapping,
        $trigger: $trigger
      });

      $target.on('modal:success', function (e, data, xhr) {
        var dirty;
        var $active;

        if (form_target === 'refresh') {
          refresh_page();
        } else if (form_target === 'redirect') {
          if (typeof xhr !== 'undefined' && 'getResponseHeader' in xhr) {
            GGRC.navigate(xhr.getResponseHeader('location'));
          } else if (data._redirect) {
            GGRC.navigate(data._redirect);
          } else {
            GGRC.navigate(data.selfLink.replace('/api', ''));
          }
        } else if (form_target === 'refresh_page_instance') {
          GGRC.page_instance().refresh();
        } else {
          $target.modal_form('hide');
          if ($trigger.data('dirty')) {
            dirty = $($trigger.data('dirty').split(',')).map(function (i, val) {
              return '[href="' + val.trim() + '"]';
            }).get().join(',');
            $(dirty).data('tab-loaded', false);
          }
          if (dirty) {
            $active = $(dirty).filter('.active [href]');
            $active.closest('.active').removeClass('active');
            $active.click();
          }
          $trigger.trigger('routeparam', $trigger.data('route'));
          $trigger.trigger('modal:success',
            Array.prototype.slice.call(arguments, 1));
        }
      });
    },
    helpform: function ($target, $trigger, option) {
      $target.modal_form(option, $trigger).ggrc_controllers_help({
        slug: $trigger.attr('data-help-slug')
      });
    }
  };

  arrangeBackgroundModals = function (modals, referenceModal) {
    var $header;
    var header_height;
    var _top;

    modals = $(modals).not(referenceModal);
    if (modals.length < 1) {
      return;
    }

    $header = referenceModal.find('.modal-header');
    header_height = $header.height() +
      parseInt($header.css('padding-top'), 10) +
      parseInt($header.css('padding-bottom'), 10);
    _top = parseInt($(referenceModal).offset().top, 10);

    modals.css({
      overflow: 'hidden',
      height: function () {
        return header_height;
      },
      top: function (i) {
        return _top - (modals.length - i) * (header_height);
      },
      'margin-top': 0,
      position: 'absolute'
    });

    modals.off('scroll.modalajax');
    modals.on('scroll.modalajax', function () {
      $(this).scrollTop(0); // fix for Chrome rendering bug when resizing block elements containing CSS sprites.
    });
  };

  arrangeTopModal = function (modals, modal) {
    var $header;
    var header_height;
    var offsetParent;
    var _scrollY;
    var _top;
    var _left;

    if (!modal || !modal.length) {
      return;
    }

    $header = modal.find('.modal-header:first');
    header_height = $header.height() +
      parseInt($header.css('padding-top'), 10) +
      parseInt($header.css('padding-bottom'), 10);
    offsetParent = modal.offsetParent();
    _scrollY = 0;
    _top = 0;
    _left = modal.position().left;

    if (!offsetParent.length || offsetParent.is('html, body')) {
      offsetParent = $(window);
      _scrollY = window.scrollY;
      _top = _scrollY +
        (offsetParent.height() -
          modal.height()) / 5 +
        header_height / 5;
    } else {
      _top = offsetParent.closest('.modal').offset().top -
        offsetParent.offset().top + header_height;
      _left = offsetParent.closest('.modal').offset().left +
        offsetParent.closest('.modal').width() / 2 - offsetParent.offset().left;
    }
    if (_top < 0) {
      _top = 0;
    }
    modal
    .css('top', _top + 'px')
    .css({
      position: 'absolute',
      'margin-top': 0,
      left: _left
    });
  };

  reconfigureModals = function () {
    var modal_backdrops = $('.modal-backdrop').css('z-index', function (i) {
      return 1040 + i * 20;
    });
    var modals = $('.modal:visible');

    modals.each(function (i) {
      var parent = this.parentNode;
      if (parent !== document.body) {
        modal_backdrops
        .eq(i)
        .detach()
        .appendTo(parent);
      }
    });
    modal_backdrops.slice(modals.length).remove();
    modals.not(this.$element).css('z-index', function (i) {
      return 1050 + i * 20;
    });
    this.$element.css('z-index', 1050 + (modals.length - 1) * 20);

    arrangeTopModal(modals, this.$element);
    arrangeBackgroundModals(modals, this.$element);
  };

  _modal_show = $.fn.modal.Constructor.prototype.show;
  $.fn.modal.Constructor.prototype.show = function () {
    var that = this;
    var $el = this.$element;
    var shownevents;
    var keyevents;

    if (!(shownevents = $._data($el[0], 'events').shown) ||
        $(shownevents).filter(function () {
          return $.inArray('arrange', this.namespace.split('.')) > -1;
        }).length < 1) {
      $el.on('shown.arrange, loaded.arrange', function (ev) {
        if (ev.target === ev.currentTarget) {
          reconfigureModals.call(that);
        }
      });
    }

    if ($el.is('body > * *')) {
      this.$cloneEl = $('<div>').appendTo($el.parent());
      can.each($el[0].attributes, function (attr) {
        that.$cloneEl.attr(attr.name, attr.value);
      });
      $el.find('*').uniqueId();
      this.$cloneEl.html($el.html());
      $el.detach().appendTo(document.body);
      this.$cloneEl.removeAttr('id').find('*').attr('data-original-id',
        function () {
          return this.id;
        }).removeAttr('id');

      $el.on(['click', 'mouseup', 'keypress', 'keydown', 'keyup', 'show',
        'shown', 'hide', 'hidden'].join('.clone ') + '.clone', function (e) {
        if (that.$cloneEl) {
          that.$cloneEl.find('[data-original-id=\'' + e.target.id + '\']')
            .trigger(new $.Event(e));
        } else {
          $el.off('.clone');
        }
      });
    }

    // prevent form submissions when descendant elements are also modals.
    if (!(keyevents = $._data($el[0], 'events').keypress) ||
        $(keyevents).filter(function () {
          return $.inArray('preventdoublesubmit',
            this.namespace.split('.')) > -1;
        }).length < 1) {
      $el.on('keypress.preventdoublesubmit', function (ev) {
        if (ev.which === 13 &&
          !$(document.activeElement).hasClass('wysihtml5')) {
          ev.preventDefault();
          if (ev.originalEvent) {
            ev.originalEvent.preventDefault();
          }
          return false;
        }
      });
    }
    if (!(keyevents = $._data($el[0], 'events').keyup) ||
        $(keyevents).filter(function () {
          return $.inArray('preventdoubleescape',
            this.namespace.split('.')) > -1;
        }).length < 1) {
      $el.on('keyup.preventdoubleescape', function (ev) {
        if (ev.which === 27 && $(ev.target).closest('.modal').length) {
          $(ev.target).closest('.modal').attr('tabindex', -1).focus();
          ev.stopPropagation();
          if (ev.originalEvent) {
            ev.originalEvent.stopPropagation();
          }
          that.hide();
        }
      });
      if (!$el.attr('tabindex')) {
        $el.attr('tabindex', -1);
      }
      setTimeout(function () {
        $el.focus();
      }, 1);
    }

    _modal_show.apply(this, arguments);
  };

  _modal_hide = $.fn.modal.Constructor.prototype.hide;
  $.fn.modal.Constructor.prototype.hide = function (ev) {
    var animated;
    var modals;
    var lastModal;

    if (ev && (ev.modalHidden)) {
      return;  // We already hid one
    }

    if (this.$cloneEl) {
      this.$element.detach().appendTo(this.$cloneEl.parent());
      this.$cloneEl.remove();
      this.$cloneEl = null;
      this.$element.off('.clone');
    }
    _modal_hide.apply(this, arguments);

    animated = $('.modal').filter(':animated');
    if (animated.length) {
      animated.stop(true, true);
    }

    modals = $('.modal:visible');
    lastModal = modals.last();
    lastModal.css({
      height: '',
      overflow: '',
      top: '',
      'margin-top': ''
    });
    arrangeTopModal(modals, lastModal);
    arrangeBackgroundModals(modals, lastModal);
    if (ev) {
      ev.modal_hidden = true; // mark that we've hidden one
    }
  };

  GGRC.register_modal_hook = function (toggle, launch_fn) {
    $('body').on('click.modal-ajax.data-api keydown.modal-ajax.data-api',
      toggle ? '[data-toggle=modal-ajax-' + toggle + ']' :
        '[data-toggle=modal-ajax]', function (e) {
          var $this = $(this);
          var modal_id;
          var target;
          var $target;
          var option;
          var href;
          var new_target;

          if ($this.hasClass('disabled')) {
            return;
          }
          if (e.type === 'keydown' && e.which !== 13) {
            return;  // activate for keydown on Enter/Return only.
          }

          href = $this.attr('data-href') || $this.attr('href');
          modal_id = 'ajax-modal-' + href.replace(/[\/\?=\&#%]/g, '-')
            .replace(/^-/, '');
          target = $this.attr('data-target') || $('#' + modal_id);

          $target = $(target);
          new_target = $target.length === 0;

          if (new_target) {
            $target = $('<div id="' + modal_id + '" class="modal hide"></div>');
            $target.addClass($this.attr('data-modal-class'));
            $this.attr('data-target', '#' + modal_id);
          }
          $target.on('hidden', function (ev) {
            if (ev.target === ev.currentTarget) {
              $target.remove();
            }
          });
          if (new_target || $this.data('modal-reset') === 'reset') {
            $target.html(preload_content());
            if ($this.prop('protocol') === window.location.protocol) {
              $target.load(href, emit_loaded);
            }
          }
          option = $target.data('modal-help') ? 'toggle' :
            $.extend({}, $target.data(), $this.data());
          launch_fn.apply($target, [$target, $this, option]);
        });
  };

  can.each({
    '': handlers.modal,
    form: handlers.form,
    helpform: handlers.helpform,
    listform: handlers.listform,
    listnewform: handlers.listnewform,
    listeditform: handlers.listeditform,
    deleteform: handlers.deleteform,
    unmapform: handlers.unmapform
  }, function (launch_fn, toggle) {
    GGRC.register_modal_hook(toggle, launch_fn);
  });
})(window.jQuery);

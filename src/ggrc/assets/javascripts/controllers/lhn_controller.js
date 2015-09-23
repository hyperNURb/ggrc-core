/*!
    Copyright (C) 2015 Google Inc., authors, and contributors <see AUTHORS file>
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
    Created By: ivan@reciprocitylabs.com
    Maintained By: ivan@reciprocitylabs.com
*/

(function(can, $, Mousetrap) {
  can.Control("CMS.Controllers.LHN", {
      defaults: {}
    }, {
      init: function () {
        this.obs = new can.Observe();
        // Set up a scroll handler to capture the current scroll-Y position on the
        // whole LHN search panel.  scroll events do not bubble, so this cannot be
        // set as a delegate on the controller element.
        this.lhs_holder_onscroll = _.debounce(function () {
          this.options.display_prefs.setLHNState({"panel_scroll" : this.scrollTop });
        }.bind(this), 250);
        this.element.find(".lhs-holder").on("scroll", this.lhs_holder_onscroll);

        // this is ugly, but the trigger doesn't nest inside our top element
        $("body").on("click", ".lhn-trigger", this.toggle_lhn.bind(this));
        Mousetrap.bind("alt+m", this.toggle_lhn.bind(this));
      },
      is_lhn_open: function () {
        var _is_open = this.options.display_prefs.getLHNState().is_open;
        if (typeof _is_open === "undefined") {
          return false;
        }
        return _is_open;
      },
      "input.widgetsearch keypress": function (el, ev) {
        var value;
        if (ev.which === 13) {
          ev.preventDefault();

          value = $(ev.target).val();
          this.do_search(value);
          this.toggle_filter_active();
        }
      },
      "submit": function (el, ev) {
        ev.preventDefault();

        var value = $(ev.target).find("input.widgetsearch").val();
        this.do_search(value);
        this.toggle_filter_active();
      },
      toggle_filter_active: function () {
        // Set active state to search field if the input is not empty:
        var $filter = this.element.find('.widgetsearch'),
            $button = this.element.find('.widgetsearch-submit'),
            $off = this.element.find('.filter-off'),
            $search_title = this.element.find(".search-title"),
            got_filter = !!$filter.val().trim().length;

        $filter.toggleClass("active", got_filter);
        $button.toggleClass("active", got_filter);
        $off.toggleClass("active", got_filter);
        $search_title.toggleClass("active", got_filter);
    },
    ".filter-off a click": function (el, ev) {
      ev.preventDefault();

      this.element.find('.widgetsearch').val('');
      this.do_search('');
      this.toggle_filter_active();
    },
    "a[data-name='work_type'] click": function (el, ev) {
        var target = $(ev.target),
            checked;

        checked = target.data('value') === 'my_work';
        this.obs.attr("my_work", checked);
          //target.closest('.btn')[checked ? 'addClass' : 'removeClass']('btn-success');
        this.options.display_prefs.setLHNState("my_work", checked);
        this.set_active_tab(checked);
    },
    toggle_lhn: function (ev) {
        ev && ev.preventDefault();
        if (!this.initialized) {
          this.init_lhn();
        }
        this.initialized = true;
        var is_open = this.is_lhn_open();

        if (is_open) {
          this.close_lhn();
        } else {
          this.open_lhn();
        }
    },
    close_lhn: function () {
        if (this.options.display_prefs.getLHNState().is_pinned) {
          return;
        }

        // not nested
        $(".lhn-trigger").removeClass("active");

        var _width = this.options.display_prefs.getLHNavSize(null, null).lhs,
            width = _width || this.element.find(".lhs-holder").width(),
            safety = 20;

        this.element.find(".lhs-holder")
            .removeClass("active")
            .css("left", (-width-safety)+"px");

        this.element.find(".lhn-type")
            .removeClass("active")
            .css("left", (-width-safety)+"px");

        this.element.find(".bar-v")
            .removeClass("active");

        this.element.find(".lhs-search")
            .removeClass("active");

        this.options.display_prefs.setLHNState({is_open: false});
     },
     open_lhn: function () {
        this.set_active_tab();

        // not nested
        $(".lhn-trigger").removeClass('hide').addClass("active");

        this.element.find(".lhs-holder")
            .css("left", "")
            .addClass("active");

        this.element.find(".lhn-type")
            .css("left", "")
            .addClass("active");

        this.element.find(".bar-v")
            .addClass("active");

        this.element.find(".lhs-search")
            .addClass("active");

        this.options.display_prefs.setLHNState({is_open: true});
    },
    set_active_tab: function (newval) {
      newval || (newval = this.obs.attr("my_work"));

      var value = ["all", "my_work"][Number(newval)];
      $("a[data-name='work_type']").removeClass("active");
      $("a[data-name='work_type'][data-value='"+value+"'").addClass("active");
    },
    init_lhn: function() {
        CMS.Models.DisplayPrefs.getSingleton().done(function(prefs) {
          var $lhs = $("#lhs"),
              lhn_search_dfd,
              my_work_tab = false;

          this.options.display_prefs = prefs;

          if (typeof prefs.getLHNState().my_work !== "undefined") {
            my_work_tab = !!prefs.getLHNState().my_work;
          }
          this.obs.attr("my_work", my_work_tab);

          lhn_search_dfd = $lhs
            .cms_controllers_lhn_search({
              observer: this.obs,
              display_prefs: prefs
            })
            .control('lhn_search')
            .display();

          $lhs.cms_controllers_lhn_tooltips();

          // Delay LHN initializations until after LHN is rendered
          lhn_search_dfd.then(function() {
            var checked = this.obs.attr('my_work'),
                value = checked ? "my_work" : "all",
                target = this.element.find('#lhs input.my-work[value='+value+']');

            target.prop('checked', true);
            target.closest('.btn')[checked ? 'addClass' : 'removeClass']('btn-success');

            // When first loading up, wait for the list in the open section to be loaded (if there is an open section), then
            //  scroll the LHN panel down to the saved scroll-Y position.  Scrolling the
            //  open section is handled in the LHN Search controller.

            if(this.options.display_prefs.getLHNState().open_category) {
              this.element.one("list_displayed", this.initial_scroll.bind(this));
            } else {
              this.initial_scroll();
            }

            this.toggle_filter_active();

            if (this.options.display_prefs.getLHNState().is_pinned) {
              this.pin();
            }
          }.bind(this));

          this.initial_lhn_render();
        }.bind(this));
    },
    initial_scroll: function () {
      this.element.find(".lhs-holder").scrollTop(
          this.options.display_prefs.getLHNState().panel_scroll
          || 0
      );
    },
    // this uses polling to make sure LHN is there
    // requestAnimationFrame takes browser render optimizations into account
    // it ain't pretty, but it works
    initial_lhn_render: function (try_count) {
      if (!$(".lhs-holder").size() || !$(".lhn-trigger").size()) {
        window.requestAnimationFrame(this.initial_lhn_render.bind(this));
        return;
      }

      this.resize_lhn();

      if (this.options.display_prefs.getLHNState().is_pinned) {
        this.open_lhn();
      } else {
        this.close_lhn();
      }
    },
    lhn_width : function(){
      return $(".lhs-holder").width()+8;
    },
    hide_lhn: function() {
      //UI-revamp
      //Here we should hide the button ||| also
        var $area = $(".area")
          , $lhsHolder = $(".lhs-holder")
          , $bar = $('.bar-v')
          , $lhnTrigger = $(".lhn-trigger")
          ;

        this.element.hide();
        $lhsHolder.css("width", 0);
        $area.css("margin-left", 0);
        $bar.hide();
        $lhnTrigger.hide();
        $lhnTrigger.addClass('hide');

        window.resize_areas();
    },
    do_search: function (value) {
      var $search_title = this.element.find(".search-title");
      value = $.trim(value);
      if (this._value === value) {
        return;
      }
      $search_title.addClass("active");
      this.obs.attr("value", value);
      this.options.display_prefs.setLHNState("search_text", value);
      this._value = value;
    },
    mousedown : false,
    dragged : false,
    resize_lhn : function(resize, no_trigger){
      resize || (resize = this.options.display_prefs && this.options.display_prefs.getLHNavSize(null, null).lhs);

      var max_width = window.innerWidth*.75,
          default_size = 240;

      if (resize < default_size) {
        resize = default_size;
      }
      resize = Math.min(resize, max_width);

      this.element.find(".lhs-holder").width(resize);

      if (resize) {
        this.options.display_prefs.setLHNavSize(null, "lhs", resize);
      }

      if (!no_trigger) {
        $(window).trigger("resize");
      }
    },
    ".bar-v mousedown" : function(el, ev) {
      var $target = $(ev.target);
      this.mousedown = true;
      this.dragged = false;
    },
    "{window} mousemove" : function(el, ev){
      if(!this.mousedown){
        return;
      }

      ev.preventDefault();
      this.dragged = true;

      if (!this.element.find(".bar-v").hasClass("disabled")) {
        this.resize_lhn(ev.pageX);
      }
    },
    "{window} mouseup" : function(el, ev){
      var self = this;
      if(!this.mousedown) return;

      this.mousedown = false;
    },
    "{window} resize" : function(el, ev) {
      this.resize_lhn(null, true); // takes care of height and min/max width
    },
    "{window} mousedown": function (el, event) {
      var x = event.pageX,
          y = event.pageY;

      if (x === undefined || y === undefined) {
        return;
      }

      var on_lhn = [".lhn-trigger:visible", ".lhn-type:visible", ".lhs-holder:visible"]
              .reduce(function (yes, selector) {
                  var $selector = $(selector),
                      bounds;

                  if (!$selector.length) {
                    return;
                  }

                  bounds = $selector[0].getBoundingClientRect();

                  return yes
                      || x >= bounds.left
                      && x <= bounds.right
                      && y >= bounds.top
                      && y <= bounds.bottom;
              }, false);

      // #extended-info - makes sure that menu doesn't close if tooltip is open and user has clicked inside
      // We should handle this form some manager, and avoid having God object
      if (!on_lhn && this.options.display_prefs && !this.options.display_prefs.getLHNState().is_pinned &&
          !$('#extended-info').hasClass('in')) {
        this.close_lhn();
      }
    },
    destroy : function() {
      this.element.find(".lhs-holder").off("scroll", self.lhs_holder_onscroll);
      this._super && this._super.apply(this, arguments);
    },
    ".lhn-pin click": function (element, event) {
      if (this.options.display_prefs.getLHNState().is_pinned) {
        this.unpin();
      }else{
        this.pin();
      }
    },
    unpin: function () {
      this.element.find(".lhn-pin").removeClass("active");
      this.element.find(".bar-v").removeClass("disabled");
      this.options.display_prefs.setLHNState("is_pinned", false);
    },
    pin: function () {
      this.element.find(".lhn-pin").addClass("active");
      this.element.find(".bar-v").addClass("disabled");
      this.options.display_prefs.setLHNState("is_pinned", true);
    }
  });
})(this.can, this.can.$, Mousetrap);

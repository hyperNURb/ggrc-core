/*
 * Copyright (C) 2015 Google Inc., authors, and contributors <see AUTHORS file>
 * Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 * Created By: ivan@reciprocitylabs.com
 * Maintained By: ivan@reciprocitylabs.com
 */

/* eslint camelcase: 0, new-cap: 0 */

(function (can) {
  var mustachePath = GGRC.mustache_path + '/risk_assessments';
  can.Model.Cacheable('CMS.Models.RiskAssessment', {
    root_object: 'risk_assessment',
    root_collection: 'risk_assessments',
    category: 'risk_assessment',
    findAll: 'GET /api/risk_assessments',
    findOne: 'GET /api/risk_assessments/{id}',
    create: 'POST /api/risk_assessments',
    update: 'PUT /api/risk_assessments/{id}',
    destroy: 'DELETE /api/risk_assessments/{id}',
    is_custom_attributable: true,
    attributes: {
      ra_manager: 'CMS.Models.Person.stub',
      ra_counsel: 'CMS.Models.Person.stub',
      context: 'CMS.Models.Context.stub',
      documents: 'CMS.Models.Document.stubs',
      program: 'CMS.Models.Program.stub',
      modified_by: 'CMS.Models.Person.stub',
      object_documents: 'CMS.Models.ObjectDocument.stubs',
      custom_attribute_values: 'CMS.Models.CustomAttributeValue.stubs'
    },
    tree_view_options: {
      add_item_view: mustachePath + '/tree_add_item.mustache',
      child_options: [{
        model: 'Document',
        mapping: 'documents',
        show_view: mustachePath + '/documents.mustache'
      }]
    },
    init: function () {
      if (this._super) {
        this._super.apply(this, arguments);
      }
      this.validateNonBlank('title');
      this.validateNonBlank('start_date');
      this.validateNonBlank('end_date');
    }
  }, {
    save: function () {
      // Make sure the context is always set to the parent program
      if (!this.context || !this.context.id) {
        this.attr('context', this.program.reify().context);
      }
      return this._super.apply(this, arguments);
    }
  });
})(window.can);

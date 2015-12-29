/*!
    Copyright (C) 2013 Google Inc., authors, and contributors <see AUTHORS file>
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
    Created By: brad@reciprocitylabs.com
    Maintained By: brad@reciprocitylabs.com
*/

(function (can, $, CMS, GGRC) {
  var scopes = new can.Observe.List(
    ['https://www.googleapis.com/auth/userinfo.email']);
  // set up a temporary global auth function so the GAPI onload can find it
  var random = Math.floor(Math.random() * 100000000);

  new GGRC.Mappings('ggrc_gdrive_integration', {
    folderable: {
      _canonical: {
        folders: 'GDriveFolder'
      },
      object_folders: new GGRC.ListLoaders.DirectListLoader(
        'ObjectFolder', 'folderable', 'object_folders'),
      folders: new GGRC.ListLoaders.ProxyListLoader(
        'ObjectFolder', 'folderable', 'folder', 'object_folders',
        'GDriveFolder')
    },
    fileable: {
      _canonical: {
        files: 'GDriveFile'
      },
      files: new GGRC.ListLoaders.ProxyListLoader(
        'ObjectFile', 'fileable', 'file', 'object_files', 'GDriveFile')
    },
    revisionable: {
      _canonical: {
        revisions: 'GDriveFileRevision'
      },
      revisions: new GGRC.ListLoaders.DirectListLoader(
        'GDriveFileRevision', 'id')
    },

    Program: {
      _mixins: ['folderable']
    },
    Audit: {
      _mixins: ['folderable'],
      extended_folders: new GGRC.ListLoaders.MultiListLoader(['folders'])
    },
    Request: {
      folders: new GGRC.ListLoaders.CrossListLoader('_audit', 'folders'),
      _audit: new GGRC.ListLoaders.DirectListLoader(
        'Audit', 'requests', 'audit'),
      extended_folders: new GGRC.ListLoaders.MultiListLoader(['folders'])
    },
    DocumentationResponse: {
      _mixins: ['fileable', 'folderable'],
      _request: new GGRC.ListLoaders.DirectListLoader(
        'Request', 'responses', 'request'),
      folders_via_request: new GGRC.ListLoaders.CrossListLoader(
        '_request', 'extended_folders'),
      extended_folders: new GGRC.ListLoaders.MultiListLoader(
        ['folders', 'folders_via_request'])
    },
    InterviewResponse: {
      _mixins: ['fileable', 'folderable']
    },
    Document: {
      _mixins: ['fileable']
    },
    Meeting: {
      _canonical: {
        events: 'GCalEvent'
      },
      events: new GGRC.ListLoaders.ProxyListLoader(
        'ObjectEvent', 'eventable', 'event', 'object_events', 'GCalEvent')
    },
    GDriveFolder: {
      _mixins: ['revisionable'],
      _canonical: {
        permissions: 'GDriveFolderPermission'
      },
      permissions: new GGRC.ListLoaders.DirectListLoader(
        'GDriveFolderPermission', 'id')
    },
    GDriveFile: {
      _mixins: ['revisionable'],
      _canonical: {
        permissions: 'GDriveFilePermission'
      },
      permissions: new GGRC.ListLoaders.DirectListLoader(
        'GDriveFilePermission', 'id')
    }
  });

  GGRC.gapi_request_with_auth = $.proxy(
    GGRC.Controllers.GAPI, 'gapi_request_with_auth');

  $(document.body).ggrc_controllers_gapi({scopes: scopes});

  window['resolvegapi' + random] = function (gapi) {
    GGRC.Controllers.GAPI.gapidfd.resolve(gapi);
    delete window['resolvegapi' + random];
  };

  $('head').append('<scr' +
    'ipt type=\'text/javascript\' src=\'https://apis.google.com/js/client.js' +
    '?onload=resolvegapi' + random + '\'></script>');

  $.extend(true, CMS.Models.Audit.attributes, {
    object_folders: 'CMS.Models.ObjectFolder.stubs',
    folders: 'CMS.Models.GDriveFolder.stubs'
  });

  can.view.mustache('picker-tag-default',
    '<ggrc-gdrive-folder-picker {{^is_allowed \'update\' instance context=\'for\'}}readonly=true{{/is_allowed}} instance=\'instance\'/>');
  GGRC.register_hook('Audit.tree_view_info', 'picker-tag-default');

  $.extend(true, CMS.Models.Document.attributes, {
    object_files: 'CMS.Models.ObjectFile.stubs',
    files: 'CMS.Models.GDriveFile.stubs'
  });

  GGRC.register_hook('DocumentationResponse.modal_connector',
    GGRC.mustache_path + '/responses/gdrive_upload_evidence.mustache');
  can.view.mustache('picker-tag-readonly',
    '<ggrc-gdrive-folder-picker instance=\'instance\' readonly=\'true\'/>');
  GGRC.register_hook('DocumentationResponse.tree_evidence',
    'picker-tag-readonly');

  $.extend(true, CMS.Models.Meeting.attributes, {
    object_events: 'CMS.Models.ObjectEvent.stubs',
    events: 'CMS.Models.GCalEvent.stubs'
  });
  GGRC.register_hook('Meeting.tree_view_info',
    GGRC.mustache_path + '/meetings/gcal_info.mustache');
  GGRC.register_hook('Role.option_detail',
    GGRC.mustache_path + '/roles/gdrive_option_detail.mustache');
})(this.can, this.can.$, this.CMS, this.GGRC);

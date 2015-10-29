/*
    Copyright (C) 2015 Google Inc., authors, and contributors <see AUTHORS file>
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
    Created By: ivan@reciprocitylabs.com
    Maintained By: ivan@reciprocitylabs.com
    */

var ExtractTextPlugin = require("extract-text-webpack-plugin"),
    _  = require("underscore"),
    GGRC = {};

GGRC = {
  get_dashboard_modules: function () {
    return _.compact(_.map(process.env.GGRC_SETTINGS_MODULE.split(" "), function (module) {
      var name;
      if (/^ggrc/.test(module)) {
        name = module.split(".")[0];
      }
      if (module === "development") {
        name = "ggrc";
      }
      if (!name) {
        return;
      }
      return "./src/" + name + "/assets/assets";
    }));
  }
};

module.exports = {
  entry: {
    dashboard: GGRC.get_dashboard_modules
  },
  output: {
    filename: "[name].js",
    chunkFilename: "[id].js"
  },
  module: {
    loaders: [{
        test: /\.css$/,
        loader: ExtractTextPlugin.extract("style-loader", "css-loader")
      },{
        test: /\.s[ac]ss$/,
        loader: ExtractTextPlugin.extract("style-loader", "css-loader!sass-loader")
      }]
    },
  plugins: [
    new ExtractTextPlugin("[name].css",{
      allChunks: true
    })
  ]
};

/* -*- Mode: Javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var { Class } = require("sdk/core/heritage");
var { registerPlugin, Plugin } = require("plugins/core");

var StyleAnnotation = Class({
  extends: Plugin,
  onAnnotate: function(resource, editor) {
    if (!resource.sheet) {
      return;
    }

    return " (" + resource.sheet.ruleCount + " rules)";
  }
});
exports.StyleAnnotation = StyleAnnotation;

registerPlugin(StyleAnnotation);

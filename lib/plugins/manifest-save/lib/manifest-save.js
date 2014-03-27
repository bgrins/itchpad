/* -*- Mode: Javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { Class } = require("sdk/core/heritage");
const { registerPlugin, Plugin } = require("plugins/core");
const tabs = require("sdk/tabs");
const { viewFor } = require('sdk/view/core');

// When a manifest.webapp file is updated, update the manifest on any app
// managers viewing the manifest.

var ManifestSave = Class({
  extends: Plugin,

  onEditorSave: function(editor) {
    let project = this.host.projectFor(editor);
    if (project.basename === "manifest.webapp") {
      // Trigger a reload in the app manager.
      for (let tab of tabs) {
        if (tab.url === "about:app-manager") {
          viewFor(tab).linkedBrowser.contentWindow.UI.refreshManifest(project.path);
        }
      }
    }
  }
});
exports.ManifestSave = ManifestSave;
registerPlugin(ManifestSave);

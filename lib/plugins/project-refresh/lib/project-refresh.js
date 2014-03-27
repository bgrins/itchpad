/* -*- Mode: Javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { Class } = require("sdk/core/heritage");
const { registerPlugin, Plugin } = require("plugins/core");
const { emit } = require("sdk/event/core");

var RefreshProject = Class({
  extends: Plugin,

  init: function(host) {
    let doc = host.document;

    this.command = host.addCommand({
      id: "refresh-project",
    });

    // this.button = host.createToolbarButton({
    //   parent: "#project-toolbar",
    //   class: "devtools-toolbarbutton refresh-button",
    //   command: this.command,
    //   tooltiptext: "Refresh project changes from disk",
    // });
  },

  onCommand: function(id, cmd) {
    if (cmd === this.command) {
      this.host.projectTree.refresh();
    }
  }
});
exports.RefreshProject = RefreshProject;
registerPlugin(RefreshProject);

/* -*- Mode: Javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { Class } = require("sdk/core/heritage");
const { registerPlugin, Plugin } = require("plugins/core");
const picker = require("helpers/file-picker");

var OpenPlugin = Class({
  extends: Plugin,

  init: function(host) {

    this.command = this.host.addCommand({
      id: "cmd-open",
      key: "o",
      modifiers: "accel"
    });

    this.fileLabel = this.host.createElement("label", {
      parent: "#plugin-toolbar-left",
      class: "itchpad-file-label"
    });
    this.onTreeSelection = this.onTreeSelection.bind(this);
    this.host.projectTree.on("selection", this.onTreeSelection);
  },

  destroy: function() {
    this.host.projectTree.off("selection", this.onTreeSelection);
  },

  onCommand: function(cmd) {
    if (cmd === "cmd-open") {
      picker.showOpen({
        window: this.host.window
      }).then(path => {
        this.open(path);
      });
    }
  },

  onTreeSelection: function(node) {
    if (!node.isDir) {
      this.fileLabel.textContent = node.basename;
    } else if (!node.parent) {
      this.fileLabel.textContent = "";
    }
  },

  open: function(path) {
    this.host.project.resourceFor(path).then(resource => {
      this.host.openResource(resource);
    });
  }
});

exports.OpenPlugin = OpenPlugin;
registerPlugin(OpenPlugin);

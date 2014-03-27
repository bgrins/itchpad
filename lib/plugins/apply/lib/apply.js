/* -*- Mode: Javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var { Class } = require("sdk/core/heritage");
var { registerPlugin, Plugin } = require("plugins/core");
const timers = require("sdk/timers");

const DEFAULT_THROTTLE_DELAY = 500;

var ApplyPlugin = Class({
  extends: Plugin,

  init: function(host) {
    this.needsUpdate = new Set();
  },

  onEditorChange: function(editor) {
    this.scheduleAutoUpdate(editor);
  },

  onCommand: function(cmd) {
    // If we haven't been auto-applying, at least apply on save (not
    // sure this is great behavior, but I'm gonna try it)
    if (cmd === "cmd-save") {
      let editor = this.host.currentEditor;
      this.apply(editor);
    }
  },

  scheduleAutoUpdate: function(editor) {
    let live = this.host.liveFor(editor);
    if (!live || !live.canAutoApply) {
      return;
    }

    this.needsUpdate.add(editor);
    if (this._updateTask) {
      timers.clearTimeout(this._updateTask);
    }

    this._updateTask = timers.setTimeout(this.applyUpdates.bind(this), DEFAULT_THROTTLE_DELAY);
  },

  applyUpdates: function() {
    if (this._updateTask) {
      timers.clearTimeout(this._updateTask);
      this._updateTask = null;
    }

    for (let editor of this.needsUpdate) {
      console.log("applying auto update of " + editor);

      this.apply(editor);
    }
    this.needsUpdate = new Set();
  },

  apply: function(editor) {
    let live = this.host.liveFor(editor);
    if (!live || !live.apply) {
      return;
    }

    let text = editor.editor.getText();
    live.apply(text);
  }
});
exports.ApplyPlugin = ApplyPlugin;
registerPlugin(ApplyPlugin);

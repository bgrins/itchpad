/* -*- Mode: Javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { Class } = require("sdk/core/heritage");
const { registerPlugin, Plugin } = require("plugins/core");
const { emit } = require("sdk/event/core");

var DirtyPlugin = Class({
  extends: Plugin,

  onEditorSave: function(editor) { this.onEditorChange(editor); },
  onEditorLoad: function(editor) { this.onEditorChange(editor); },

  onEditorChange: function(editor) {
    if (!editor || !editor.editor) {
      return;
    }
    let tree = this.host.tree;

    // Dont' force a refresh unless the dirty state has changed...
    let priv = this.priv(editor);
    let clean = editor.editor.isClean();
    if (priv.isClean !== clean) {
      let resource = editor.shell.project;
      emit(resource, "label-change", resource);
      priv.isClean = clean;
    }
  },

  onAnnotate: function(resource, editor, elt) {
    if (editor && editor.editor && !editor.editor.isClean()) {
      elt.textContent = '*' + resource.displayName;
      return true;
    }
  }
});
exports.DirtyPlugin = DirtyPlugin;

registerPlugin(DirtyPlugin);

/* -*- Mode: Javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { Cu } = require("chrome");
const { Class } = require("sdk/core/heritage");
const promise = require("helpers/promise");
const { registerPlugin, Plugin } = require("plugins/core");

var StatusBarPlugin = Class({
  extends: Plugin,

  init: function() {
    this.box = this.host.createElement("hbox", {
      parent: "#itchpad-toolbar-bottom"
    });

    this.activeMode = this.host.createElement("label", {
      parent: this.box,
      class: "itchpad-basic-display"
    });

    this.cursorPosition = this.host.createElement("label", {
      parent: this.box,
      class: "itchpad-basic-display"
    });
  },

  render: function(editor) {
    this.activeMode.value = editor.toString();
    if (editor.editor) {
      let cursorStart = editor.editor.getCursor("start");
      let cursorEnd = editor.editor.getCursor("end");
      if (cursorStart.line === cursorEnd.line && cursorStart.ch === cursorEnd.ch) {
        this.cursorPosition.value = cursorStart.line + " " + cursorStart.ch;
      } else {
        this.cursorPosition.value = cursorStart.line + " " + cursorStart.ch + " | " +
                                    cursorEnd.line + " " + cursorEnd.ch;
      }
    } else {
      this.cursorPosition.value = "";
    }
  },

  onEditorChange: function(editor) {
    this.render(editor);
  },

  onEditorCursorActivity: function(editor) {
    this.render(editor);
  },

  onEditorActivated: function(editor) {
    this.render(editor);
  },

});

exports.StatusBarPlugin = StatusBarPlugin;
registerPlugin(StatusBarPlugin);

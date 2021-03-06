/* -*- Mode: Javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { Cu } = require("chrome");
const { Class } = require("sdk/core/heritage");
const { EventTarget } = require("sdk/event/target");
const { emit } = require("sdk/event/core");
const promise = require("helpers/promise");

const Editor  = require("devtools/sourceeditor/editor");


const HTML_NS = "http://www.w3.org/1999/xhtml";
const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

var ItchEditor = Class({
  extends: EventTarget,

  toString: function() {
    return this.label || "";
  },

  initialize: function(document) {
    this.doc = document;
    this.label = "";
    this.elt = this.doc.createElement("vbox");
    this.elt.setAttribute("flex", "1");
    this.elt.editor = this;
    this.toolbar = this.doc.querySelector("#itchpad-toolbar");
  },

  setToolbarVisibility: function() {
    if (this.hidesToolbar) {
      this.toolbar.setAttribute("hidden", "true");
    } else {
      this.toolbar.removeAttribute("hidden");
    }
  },

  load: function(resource) {
    return promise.resolve();
  },

  focus: function() {
    return promise.resolve();
  }
});
exports.ItchEditor = ItchEditor;

var MODE_CATEGORIES = {};

MODE_CATEGORIES[Editor.modes.text.name] = "txt";
MODE_CATEGORIES[Editor.modes.js.name] = "js";
MODE_CATEGORIES[Editor.modes.html.name] = "html";
MODE_CATEGORIES[Editor.modes.css.name] = "css";

var TextEditor = Class({
  extends: ItchEditor,

  get extraKeys() {
    let extraKeys = {};


    // Copy all of the registered keys into extraKeys object, to notify CodeMirror
    // that it should be ignoring these keys
    [...this.doc.querySelectorAll("#itchpad-keyset key")].forEach((key) => {
      let keyUpper = key.getAttribute("key").toUpperCase();
      let toolModifiers = key.getAttribute("modifiers");
      let modifiers = {
        alt: toolModifiers.contains("alt"),
        shift: toolModifiers.contains("shift"),
      };
      extraKeys[Editor.accel(keyUpper, modifiers)] = () => {
        let event = this.doc.createEvent('Event');
        event.initEvent('command', true, true);
        let command = this.doc.querySelector("#" + key.getAttribute("command"));
        command.dispatchEvent(event);
      };
    });
    return extraKeys;
  },

  get category() {
    return MODE_CATEGORIES[this.editor.getMode().name];
  },

  initialize: function(document, mode=Editor.modes.text) {
    ItchEditor.prototype.initialize.call(this, document);
    this.label = mode.name;
    this.editor = new Editor({
      mode: mode,
      lineNumbers: true,
      extraKeys: this.extraKeys
    });

    this.appended = this.editor.appendTo(this.elt);
  },

  load: function(resource) {
    return this.appended.then(() => {
      return resource.load();
    }).then(text => {
      this.editor.setText(text);
      this.editor.setClean();
      emit(this, "load");
    }).then(null, console.error);
  },

  save: function(resource) {
    return resource.save(this.editor.getText()).then(() => {
      this.editor.setClean();
      emit(this, "save", resource);
    });
  },

  focus: function(resource) {
    return this.appended.then(() => {
      this.editor.focus();
    });
  }
});


function textMode(mode) {
  return function(document) { return TextEditor(document, mode); }
}

exports.TextEditor = TextEditor;
exports.JSEditor = textMode(Editor.modes.js);
exports.CSSEditor = textMode(Editor.modes.css);
exports.HTMLEditor = textMode(Editor.modes.html);

const categoryMap = {
  "txt": exports.TextEditor,
  "html": exports.HTMLEditor,
  "xml": exports.HTMLEditor,
  "css": exports.CSSEditor,
  "js": exports.JSEditor,
  "json": exports.JSEditor
};

function EditorTypeForResource(resource) {
  return categoryMap[resource.contentCategory] || TextEditor;
}

exports.EditorTypeForResource = EditorTypeForResource;

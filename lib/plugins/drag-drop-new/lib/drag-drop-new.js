/* -*- Mode: Javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { Class } = require("sdk/core/heritage");
const { registerPlugin, Plugin } = require("plugins/core");
const promise = require("helpers/promise");
const Editor  = require("devtools/sourceeditor/editor");
const { Cu } = require("chrome");
const { VariablesView } = Cu.import("resource:///modules/devtools/VariablesView.jsm", {});
const { ObjectClient } = Cu.import("resource://gre/modules/devtools/dbg-client.jsm", {});
const { EnvironmentClient } = Cu.import("resource://gre/modules/devtools/dbg-client.jsm", {});
const OS = require("helpers/osfile");

var DragDropNew = Class({
  extends: Plugin,

  init: function(host) {
    this.onDrop = this.onDrop.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.dropzone = host.document.querySelector("#main-deck");
    this.dropzone.addEventListener("dragover", this.onDragOver, true);
    this.dropzone.addEventListener("drop", this.onDrop, true);
  },

  onDragOver: function(event) {
    event.preventDefault();

  },
  onDrop: function(event) {
    event.preventDefault();

    // Ready to do something with the dropped object
    var allTheFiles = event.dataTransfer.files || [];

    [...allTheFiles].forEach((file) => {
      let path = file.mozFullPath;
      if (file.type === "") {
        this.host.project.addPath(path);
      }
    });

    this.host.project.save();
  },

  destroy: function() {
    this.dropzone.removeEventListener("dragover", this.onDragOver, true);
    this.dropzone.removeEventListener("drop", this.onDrop, true);
  }

});

exports.DragDropNew = DragDropNew;

registerPlugin(DragDropNew);

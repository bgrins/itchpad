/* -*- Mode: Javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { Class } = require("sdk/core/heritage");
const { StoreCollection } = require("store-collection");
const { StylesStore } = require("stores/styles");

// This is a bad name for the collection of stores tied to the live target.
// Target was already taken, Live didn't sound right.  A rename would be
// welcome.
var PageCollection = Class({
  extends: StoreCollection,

  initialize: function() {
    StoreCollection.prototype.initialize.call(this);

    this.styles = new StylesStore();
    this.addStore(this.styles);
  },

  setTarget: function(target) {
    for (let store of this.stores) {
      store.setTarget(target);
    }
  }
});

exports.PageCollection = PageCollection;

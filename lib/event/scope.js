/* -*- Mode: Javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { Class } = require("sdk/core/heritage");
const { EventTarget } = require("sdk/event/target");

var Scope = Class({
  initialize: function(owner) {
    this.owner = owner;
  },

  on: function(target, event, handler) {
    this.listeners = this.listeners || [];
    this.listeners.push({
      target: target,
      event: event,
      handler: handler
    });
    target.on(event, handler);
  },

  off: function(t, e, h) {
    if (!this.listeners) return;
    this.listeners = this.listeners.filter(({ target, event, handler }) => {
      return !(target === t && event === e && handler === h);
    });
    target.off(event, handler);
  },

  clear: function(clearTarget) {
    if (!this.listeners) return;
    this.listeners = this.listeners.filter(({ target, event, handler }) => {
      if (target === clearTarget) {
        target.off(event, handler);
        return false;
      }
      return true;
    });
  },
  destroy: function() {
    this.owner = undefined;
    if (!this.listeners) return;
    this.listeners.forEach(({ target, event, handler }) => {
      target.off(event, handler);
    });
    this.listeners = undefined;
  }
});

var scopes = new WeakMap();
function scope(owner) {
  if (!scopes.has(owner)) {
    let scope = new Scope(owner);
    scopes.set(owner, scope);
    return scope;
  }
  return scopes.get(owner);
}
exports.scope = scope;

exports.on = function(owner, target, event, handler) {
  if (!target) return;
  scope(owner).on(target, event, handler);
}

exports.off = function(owner, target, event, handler) {
  if (!target) return;
  scope(owner).off(target, event, handler);
}

exports.forget = function(owner, target) {
  scope(owner).clear(target);
}

exports.done = function(owner) {
  scope(owner).destroy();
  scopes.delete(owner);
}


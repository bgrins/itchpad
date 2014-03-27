/* -*- Mode: Javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const tabs = require("sdk/tabs");
const data = require("sdk/self").data;

exports.modifyAppManager = function() {
  tabs.on("ready", (tab) => {
    if (tab.url == "about:app-manager") {
      tab.attach({
        contentScriptFile: data.url("app-manager-mod.js"),
        onMessage: (msg) => {

        }
      });
    }
  });
}

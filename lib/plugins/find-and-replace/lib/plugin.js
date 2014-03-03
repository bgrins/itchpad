const { Class } = require("sdk/core/heritage");
const { registerPlugin, Plugin } = require("plugins/core");

var FindAndReplace = Class({
  extends: Plugin,

  init: function(host) {
    this.command = this.host.addCommand({
      id: "find",
      key: "f",
      modifiers: "accel"
    });

    this.searchPanel = this.host.createElement("hbox", {
      parent: "#itchpad-toolbar-bottom",
      id: "plugin-search-panel",
      hidden: true
    });

    this.searchBox = this.host.createElement("textbox", {
      parent: "#plugin-search-panel",
      type: "search",
      timeout: "50",
      class: "devtools-searchinput",
    });

    this.onSearchFocus = this.onSearchFocus.bind(this);
    this.onSearchInput = this.onSearchInput.bind(this);
    this.onSearchKey = this.onSearchKey.bind(this);

    this.searchBox.addEventListener("focus", this.onSearchFocus, true);
    this.searchBox.addEventListener("input", this.onSearchInput, true);
    this.searchBox.addEventListener("keypress", this.onSearchKey, true);
  },

  onSearchFocus: function() {

  },

  onSearchInput: function() {

  },

  onSearchKey: function(e) {
    switch (e.keyCode) {
      case e.DOM_VK_RETURN:
      case e.DOM_VK_ENTER: {
        break;
      }
      case e.DOM_VK_DOWN: {
        break;
      }
      case e.DOM_VK_UP: {
        break;
      }
      case e.DOM_VK_ESCAPE: {
        this.finish();
        break;
      }
    }
  },

  finish: function() {
    this.hide();
  },

  show: function() {
    this.searchPanel.removeAttribute("hidden");
    this.searchBox.focus();
    this.searchBox.select();
  },

  hide: function() {
    this.searchPanel.setAttribute("hidden", "true");
    this.searchBox.blur();
  },

  onCommand: function(cmd, target) {
    if (cmd === "find") {
      this.show();
    }
  }
});

exports.FindAndReplace = FindAndReplace;
registerPlugin(FindAndReplace);

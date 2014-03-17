const { Class } = require("sdk/core/heritage");
const { registerPlugin, Plugin } = require("plugins/core");

var FindAndReplace = Class({
  extends: Plugin,

  initMenu: function() {
    this.menu = this.host.createElement("menu", {
      parent: "#itchpad-menubar",
      id: "menuFindAndReplace",
      label: "Find",
      accesskey:"F"
    });

    this.menuPopup = this.host.createElement("menupopup", {
      parent: this.menu,
      id: "menuFindAndReplacePopup"
    });

    this.host.createElement("menuitem", {
      parent: this.menuPopup,
      label: "Find...",
      accesskey: "F",
      command: "find"
    });

    this.host.createElement("menuseparator", {
      parent: this.menuPopup
    });

    this.host.createElement("menuitem", {
      parent: this.menuPopup,
      label: "Replace...",
      accesskey: "R",
      command: "replace"
    });

  },

  init: function(host) {
    this.initMenu();

    this.findCommand = this.host.addCommand({
      id: "find",
      key: "f",
      modifiers: "accel"
    });

    this.replaceCommand = this.host.addCommand({
      id: "replace",
      key: "f",
      modifiers: ["alt", "accel"]
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

    this.replaceBox = this.host.createElement("textbox", {
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
    this.replaceBox.setAttribute("hidden", "true");
    this.searchPanel.removeAttribute("hidden");
    this.searchBox.focus();
    this.searchBox.select();
  },

  showReplace: function() {
    this.show();
    this.replaceBox.removeAttribute("hidden");
  },

  hide: function() {
    this.searchPanel.setAttribute("hidden", "true");
    this.searchBox.blur();
  },

  onCommand: function(cmd, target) {
    if (cmd === "find") {
      this.show();
    } else if (cmd === "replace") {
      this.showReplace();
    }
  }
});

exports.FindAndReplace = FindAndReplace;
registerPlugin(FindAndReplace);

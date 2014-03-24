const { Cc, Ci, Cu } = require('chrome');
const Itchpad = require("itchpad");
const { Class } = require("sdk/core/heritage");
const { Unknown, Service } = require('sdk/platform/xpcom');
const { registerPlugin } = require("plugins/core");
const prefs = require("sdk/preferences/service");
const { Projects } = require("project");
const { Menuitem } = require("menuitems");
const promise = require("helpers/promise");
var { Hotkey } = require("sdk/hotkeys");

// Add menu items and hotkeys for extension.
// XXX: When in m-c do not add these (at least if pref is not on)
var showHotKey = Hotkey({
  combo: "accel-shift-i",
  onPress: function() {
    showItchpad();
  }
});

Menuitem({
  id: 'devtools-itchpad-menuitem',
  menuid: 'menuWebDeveloperPopup',
  label: 'Itchpad',
  useChrome: true,
  onCommand: function(window) {
    showItchpad();
  }
});

// Set up some preferences from the environment for easier cfx testing.
(function setupPrefs() {
  const { env } = require("sdk/system/environment");

  if (env.ITCHPAD_PROJECT_DIRS) {
    prefs.set("itchpad.project-dirs", env.ITCHPAD_PROJECT_DIRS);
  }
})();

function showItchpad() {
  const { getMostRecentWindow } = require("sdk/window/utils");
  let current = getMostRecentWindow("devtools:itchpad");
  if (current) {
    current.focus();
    return;
  }

  Projects.defaultProject().then(project => {
    openItchpadWindow(project).then(win => {
      let iframe = win.document.getElementById("itchpad-iframe");
      let itchpad = Itchpad.Itchpad(iframe, project);
    });

  }).then(null, console.error);
}

function openItchpadWindow(proj) {
  let deferred = promise.defer();

  let windowName = "Itchpad-project:" + proj.id;

  let windows = require("sdk/window/utils").windows();
  for (let win of windows) {
    if (win.name === windowName) {
      return promise.resolve(win);
    }
  }

  const { open } = require("sdk/window/utils");

  let win = open("chrome://itchpad/content/itchpad-window.xul", {
    name: windowName,
    features: {
      chrome: true,
      titlebar: true,
      toolbar: true,
      centerscreen: true,
      resizable: true,
      dialog: "no",
    }
  });

  let frameLoad = function(event) {
    win.removeEventListener("load", frameLoad, true);
    deferred.resolve(win);
  }.bind(this);

  win.addEventListener("load", frameLoad, true);
  win.focus();

  return deferred.promise;
}

require("appmanager").modifyAppManager();

// Load default plugins

// Uncomment to get logging of addon events.
require("plugins/logging/lib/logging");

require("plugins/apply/lib/apply");
require("plugins/dirty/lib/dirty");
require("plugins/delete/lib/delete");
require("plugins/new/lib/new");
require("plugins/save/lib/save");
require("plugins/open/lib/open");
require("plugins/style/lib/style");
// require("plugins/target-chooser/lib/target-chooser");
// require("plugins/variable-sidebar/lib/variable-sidebar");
require("plugins/notify/lib/notify");
require("plugins/fuzzy-search/lib/plugin");
require("plugins/image-view/lib/plugin");
require("plugins/manifest-save/lib/manifest-save");
require("plugins/project-dirs/lib/project-dirs");
require("plugins/project-refresh/lib/project-refresh");
// require("plugins/project-live-preview/lib/project-live-preview");
require("plugins/project-settings/lib/project-settings");
require("plugins/drag-drop-new/lib/drag-drop-new");
require("plugins/find-and-replace/lib/plugin");
require("plugins/app-manager/lib/plugin");
require("plugins/status-bar/lib/plugin");

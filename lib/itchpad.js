/* -*- Mode: Javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { Class } = require("sdk/core/heritage");

const { Project } = require("project");
const { PageCollection } = require("page");
const { TreeView } = require("tree");
const { ShellDeck } = require("shells");
const { Resource } = require("stores/base");
const { ResourceMap, Pair } = require("resource-map");
const { registeredPlugins } = require("plugins/core");
const { EventTarget } = require("sdk/event/target");
const { on, forget } = require("event/scope");
const { emit } = require("sdk/event/core");
const { merge } = require("sdk/util/object");
const promise = require("helpers/promise");
const { ToolSidebar } = require("devtools/framework/sidebar");

const { Cc, Ci, Cu } = require("chrome");
const { ViewHelpers } = Cu.import("resource:///modules/devtools/ViewHelpers.jsm", {});
Cu.import("resource:///modules/devtools/DOMHelpers.jsm");

const ITCHPAD_URL = "chrome://itchpad/content/itchpad.xul"

/**
 * This is the main class tying together an instance of the pad.  It is
 * created in itchpad.xul.
 *
 * It mediates access to a few resources:
 * - The list of plugins for this instance.
 * - The tree view that views file trees.
 * - The ShellDeck that contains all editors for this instance.
 * - The Project that includes local resources for the instance.
 * - The list of Live Stores for the instance.
 * - The ResourceMap that ties Live resources to Project resources.
 * - The Target associated with this instance, if any.
 * - The toolbox associated with this instance, if any.
 */
var Itchpad = Class({
  extends: EventTarget,

  initialize: function(options = {}) {
    this.project = options.project;
    this.stores = new Set();
    this._onNodeSelection = this._onNodeSelection.bind(this);
    this._onEditorCreated = this._onEditorCreated.bind(this);
    this._onEditorActivated = this._onEditorActivated.bind(this);
    this._updateEditorMenuItems = this._updateEditorMenuItems.bind(this);
  },

  load: function(iframe) {
    let deferred = promise.defer();
    this.iframe = iframe;

    let domReady = () => {
      this._onLoad();
      deferred.resolve();
    };

    let domHelper = new DOMHelpers(this.iframe.contentWindow);
    domHelper.onceDOMReady(domReady);

    this.iframe.setAttribute("src", ITCHPAD_URL);

    return deferred.promise;
  },

  _onLoad: function() {
    this.document = this.iframe.contentDocument;
    this.window = this.iframe.contentWindow;

    this._buildSidebar();

    this.window.addEventListener("unload", this.destroy.bind(this));

    // Editor management
    this.shells = new ShellDeck(this.document, this);
    this.shells.on("editor-created", this._onEditorCreated);
    this.shells.on("editor-activated", this._onEditorActivated);

    let shellContainer = this.document.querySelector("#shells-deck-container");
    shellContainer.appendChild(this.shells.elt);

    let popup = this.document.querySelector("#edit-menu-popup");
    popup.addEventListener("popupshowing", this.updateEditorMenuItems);

    // Store/Resource management
    this.resourceMap = new ResourceMap();

    if (!this.project) {
      this.project = new Project({
        id: "Test",
        name: "App",
        directories: [],
        openFiles: []
      });
    }
    this.setProject(this.project);
    this.setPage(new PageCollection());

    this._initPlugins();
  },

  _buildSidebar: function() {
    // Create the sources sidebar
    this.projectTree = new CollectionTree(this.document, {
      nodeVisible: this.nodeVisible.bind(this),
      nodeFormatter: this.formatNode.bind(this)
    });
    this.projectTree.on("selection", this._onNodeSelection);

    let sourcesBox = this.document.querySelector("#sources");
    sourcesBox.appendChild(this.projectTree.elt);

    // Plugin/inspection sidebar
    let tabbox = this.document.querySelector("#sidebar");
    this.sidebar = new ToolSidebar(tabbox, this, "itchpad");
    ViewHelpers.togglePane({
      visible: false,
      delayed: false,
      animated: false
    }, this.document.querySelector("#sidebar-box"));
  },

  _initPlugins: function() {
    this.commands = this.document.querySelector("#itchpad-commandset");
    this.commands.addEventListener("command", (evt) => {
      evt.stopPropagation();
      evt.preventDefault();
      this.pluginDispatch("onCommand", evt.target.id, evt.target);
    });
    this.pluginMethods = {};
    this.loadPlugins();
  },

  _updateEditorMenuItems: function() {
    this.window.goUpdateGlobalEditMenuItems();
    this.window.goUpdateGlobalEditMenuItems();
    let commands = ['cmd_undo', 'cmd_redo', 'cmd_delete', 'cmd_findAgain'];
    commands.forEach(this.window.goUpdateCommand);
  },

  destroy: function() {
    this._plugins.forEach(plugin => { plugin.destroy(); });
  },

  // Set the current project viewed by the itchpad.
  setProject: function(project) {
    this.project = project;
    this.resourceMap.setProject(project);
    this.projectTree.setCollection(project);
  },

  setProjectToSinglePath: function(path, opts = {}) {
    let existingPaths = [...this.projectTree.models].map(model=>model.path);
    console.log(
      "Setting project to single path: " + path,
      "Existing paths: ", existingPaths.join(", ")
    );
    this.project.customOpts = opts;
    this.project.projectType = "APP_MANAGER";
    this.project.removePaths(existingPaths);
    this.project.addPath(path);
    this.project.save();
  },

  setPage: function(page) {
    this.page = page;
    this.resourceMap.setPage(page);
  },

  openResource: function(resource) {
    let pair = this.resourceMap.pair(resource);
    let shell = this.shells.open(pair, resource);

    this.projectTree.select(resource);
  },

  // When a node is selected in the tree, open its associated editor.
  _onNodeSelection: function(resource) {
    // XXX: Should check to see if there is a suitable editor rather
    // than blacklisting these types
    if (resource.isDir && resource.parent) {
      return;
    }
    this.openResource(resource);
  },

  /**
   * Plugin UI commands.  These aren't really great, we should rethink these.
   */

  createElement: function(type, options) {
    let elt = this.document.createElement(type);

    let parent;

    for (let opt in options) {
      if (opt === "command") {
        let command = typeof(options.command) === "string" ? options.command : options.command.id;
        elt.setAttribute("command", command);
      } else if (opt === "parent") {
        continue;
      } else {
        elt.setAttribute(opt, options[opt]);
      }
    }

    if (options.parent) {
      let parent = options.parent;
      if (typeof(parent) === "string") {
        parent = this.document.querySelector(parent);
      }
      parent.appendChild(elt);
    }

    return elt;
  },

  addCommand: function(definition) {
    let command = this.document.createElement("command");
    command.setAttribute("id", definition.id);
    if (definition.key) {
      let key = this.document.createElement("key");
      key.id = "key_" + definition.id;

      let keyName = definition.key;
      if (keyName.startsWith("VK_")) {
        key.setAttribute("keycode", keyName);
      } else {
        key.setAttribute("key", keyName);
      }
      key.setAttribute("modifiers", definition.modifiers);
      key.setAttribute("command", definition.id);
      this.document.getElementById("itchpad-keyset").appendChild(key);
    }
    command.setAttribute("oncommand", "void(0);"); // needed. See bug 371900
    this.document.getElementById("itchpad-commandset").appendChild(command);
    return command;
  },


  createMenuItem: function(options) {
    return this.createElement("menuitem", options);
  },

  createToolbarGroup: function(options) {
    return this.createElement("hbox", merge({
      class: "devtools-toolbarbutton-group"
    }, options));
  },

  createToolbarButton: function(options) {
    return this.createElement("toolbarbutton", merge({
      class: "devtools-toolbarbutton"
    }, options));
  },

  addSidebar: function(name, url) {
    let deferred = promise.defer();

    this.sidebar.once(name + "-ready", () => {
      deferred.resolve(this.sidebar.getWindowForTab(name));
    });
    this.sidebar.addTab(name, url, false);

    return deferred.promise;
  },

  showSidebar: function(name) {
    this.sidebar.select(name);
    let sidebar = this.document.getElementById("sidebar-box");
    ViewHelpers.togglePane({ visible: true, animated: true, delayed: true }, sidebar);
  },

  hideSidebar: function() {
    let sidebar = this.document.getElementById("sidebar-box");
    ViewHelpers.togglePane({ visible: false, animated: true, delayed: true }, sidebar);
  },

  loadPlugins: function() {
    this._plugins = [];

    for (let plugin of registeredPlugins) {
      try {
        this._plugins.push(plugin(this));
      } catch(ex) {
        console.exception(ex);
      }
    }

    this.pluginDispatch("lateInit");
  },

  getPlugin: function(pluginType) {
    for (let plugin of this.plugins) {
      if (plugin.constructor === pluginType) {
        return plugin;
      }
    }
    return null;
  },

  get plugins() {
    if (!this._plugins) {
      console.log("plugins requested before _plugins was set");
      return [];
    }
    return this._plugins.filter(plugin => {
      return !this.project.projectType ||
             !plugin.projectType ||
             this.project.projectType === plugin.projectType;
    });
  },

  _onEditorCreated: function(editor) {
    this.plugins.forEach(plugin => plugin.onEditorCreated(editor));
    this._editorListen(editor, "change", "onEditorChange");
    this._editorListen(editor, "cursorActivity", "onEditorCursorActivity");
    this._containerListen(editor, "load", "onEditorLoad");
    this._containerListen(editor, "save", "onEditorSave");
  },

  _onEditorActivated: function(editor) {
    editor.setToolbarVisibility();
    this.plugins.forEach(plugin => plugin.onEditorActivated(editor));
  },

  /**
   * Call a method on all plugins that implement the method.
   */
  pluginDispatch: function(handler, ...args) {
    this.plugins.forEach(plugin => {
      try {
        if (handler in plugin) plugin[handler](...args);
      } catch(ex) {
        console.error(ex);
      }
    })
  },

  _containerListen: function(editor, event, handler) {
    editor.on(event, (...args) => {
      this.pluginDispatch(handler, editor, ...args);
    });
  },

  _editorListen: function(editor, event, handler) {
    if (!editor.editor) {
      return;
    }
    editor.editor.on(event, (...args) => {
      this.pluginDispatch(handler, editor, ...args);
    });
  },

  /**
   * Set the current devtools target for the pad.
   */
  setTarget: function(target, own=false) {
    if (target === this.target) {
      return promise.resolve();
    }

    if (this.ownsTarget && this.target) {
      this.target.destroy();
    }

    this._webConsolePromise = null;
    this.ownsTarget = own;
    this.target = target;

    let remote = target ? target.makeRemote() : promise.resolve();

    return remote.then(() => {
      this.page.setTarget(target);
      emit(this, "target-changed");
    }).then(null, console.error);
  },

  /**
   * Get a WebConsoleClient for communicating with the current target.
   */
  getWebConsoleClient: function() {
    if (this._webConsolePromise) {
      return this._webConsolePromise;
    }
    let deferred = promise.defer();
    this.target.client.attachConsole(this.target.form.consoleActor, [], (response, consoleClient) => {
      try {
        if (response.error) {
          deferred.reject(response.error);
          return;
        }
        deferred.resolve(consoleClient);
      } catch(ex) {
        console.error(ex);
      }
    });
    this._webConsolePromise = deferred.promise;
    return deferred.promise
  },

  /**
   * Find a shell for an editor, pair, or resource.
   */
  shellFor: function(resource) {
    let pair = this.pairFor(resource);
    return this.shells.shellFor(pair);
  },

  /**
   * Returns the Editor for a given resource.
   */
  editorFor: function(resource) {
    let shell = this.shellFor(resource);
    return shell ? shell.editor : shell;
  },

  /**
   * Returns the Pair that matches a given editor, pair, or resource.
   */
  pairFor: function(thing) {
    if (thing instanceof Pair) {
      return thing;
    }
    if (thing instanceof Resource) {
      return this.resourceMap.pair(thing);
    }
    if (thing.pair) {
      return thing.pair;
    }
    throw new Error("Don't know how to get a pair associated with: " + thing);
  },

  /**
   * Returns a live resource for the given editor, pair, or resource.
   */
  liveFor: function(thing) {
    let pair = this.pairFor(thing);
    return pair ? pair.live : null;
  },

  /**
   * Returns a project resource for the given editor, pair, or resource.
   */
  projectFor: function(thing) {
    let pair = this.pairFor(thing);
    return pair ? pair.project : null;
  },

  /**
   * Decide whether a given node should be hidden in the tree.
   */
  nodeVisible: function(node) {
    return true;
  },

  /**
   * Format the given node for display in the resource tree.
   */
  formatNode: function(node, elt) {
    let editor = this.editorFor(node);
    let renderedByPlugin = false;

    if (this.plugins) {
      this.plugins.forEach(plugin => {
        if (!plugin.onAnnotate) {
          return;
        }
        if (plugin.onAnnotate(node, editor, elt)) {
          renderedByPlugin = true;
        }
      });
    }

    if (!renderedByPlugin) {
      elt.textContent = node.displayName;
    }
  },

  get sourcesVisible() {
    return this.sourceToggle.hasAttribute("pane-collapsed");
  },

  get currentShell() {
    return this.shells.currentShell;
  },

  get currentEditor() {
    return this.shells.currentEditor;
  },
});

var CollectionTree = Class({
  extends: TreeView,

  initialize: function(document, options) {
    TreeView.prototype.initialize.call(this, document, options);
  },

  setCollection: function(coll) {
    if (this.coll) {
      forget(this, this.coll);
      for (let store of this.coll.allStores()) {
        this.removeModel(store);
      }
    }
    this.coll = coll;
    if (this.coll) {
      on(this, coll, "store-added", this.addModel.bind(this));
      on(this, coll, "store-removed", this.removeModel.bind(this));
      on(this, coll, "project-saved", this.refresh.bind(this));
      this.refresh();
    }
  },

  refresh: function() {
    for (let store of this.coll.allStores()) {
      this.addModel(store);
    }
  }
});

exports.Itchpad = Itchpad;

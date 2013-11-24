const { Class } = require("sdk/core/heritage");
const { registerPlugin, Plugin } = require("plugins/core");
const picker = require("helpers/file-picker");

// Handles the save command.
var SavePlugin = Class({
  extends: Plugin,

  init: function(host) {
    this.host.createMenuItem({
      parent: "file-menu-popup",
      label: "Save",
      command: "cmd-save",
      key: "key-save"
    });
    this.host.createMenuItem({
      parent: "file-menu-popup",
      label: "Save As",
      command: "cmd-saveas",
    });
  },

  onCommand: function(cmd) {
    if (cmd === "cmd-save") {
      this.save();
    } else if (cmd === "cmd-saveas") {
      this.saveAs();
    }
  },

  saveAs: function() {
    let editor = this.host.currentEditor;
    let project = editor.pair.project;

    let resource;
    picker.showSave({
      window: this.host.window,
      directory: project && project.parent ? project.parent.path : null,
      defaultName: project ? project.basename : null,
    }).then(path => {
      return this.createResource(path);
    }).then(res => {
      resource = res;
      return this.saveResource(editor, resource);
    }).then(() => {
      this.host.openResource(resource);
    }).then(null, console.error);
  },

  save: function() {
    let editor = this.host.currentEditor;
    let project = editor.pair.project;
    if (!project) {
      return this.saveAs();
    }

    return this.saveResource(editor, project);
  },

  createResource: function(path) {
    let store = this.host.project.storeContaining(path);
    if (!store) {
      store = this.host.openStore;
    }

    return store.resourceFor(path, { create: true })
  },

  saveResource: function(editor, resource) {
    // If this wasn't a project editor, update the project
    // editor.
    let shell = this.host.shellFor(resource);
    let projectEditor = shell ? shell.editors.project : null;
    let text = -1;
    if (projectEditor && projectEditor !== editor) {
      text = editor.editor.getText();
    }
    return editor.save(resource).then(() => {
      if (text != -1) {
        projectEditor.editor.setText(text);
      }
    });
  }
})
exports.SavePlugin = SavePlugin;
registerPlugin(SavePlugin);

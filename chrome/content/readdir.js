/* -*- Mode: Javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

importScripts("resource://gre/modules/osfile.jsm");

function readDir(path, ignore, maxDepth = Infinity) {
  let ret = {};

  let set = new Set();

  let info = OS.File.stat(path);
  set.add({
    path: path,
    name: info.name,
    isDir: info.isDir,
    isSymLink: info.isSymLink,
    depth: 0
  });

  for (let info of set) {
    let children = [];

    if (info.isDir && !info.isSymLink) {
      if (info.depth > maxDepth) {
        continue;
      }

      let iterator = new OS.File.DirectoryIterator(info.path);
      try {
        for (let child in iterator) {
          if (ignore && child.name.match(ignore)) {
            continue;
          }

          children.push(child.path);
          set.add({
            path: child.path,
            name: child.name,
            isDir: child.isDir,
            isSymLink: child.isSymLink,
            depth: info.depth + 1
          });
        }
      } finally {
        iterator.close();
      }
    }

    ret[info.path] = {
      name: info.name,
      isDir: info.isDir,
      isSymLink: info.isSymLink,
      depth: info.depth,
      children: children,
    };
  }

  return ret;
};

onmessage = function (event) {
  try {
    let {path, ignore, depth} = event.data;
    let message = readDir(path, ignore, depth);
    postMessage(message);
  } catch(ex) {
    console.log(ex);
  }
};



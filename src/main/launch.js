import path from "path";

import { shell, BrowserWindow } from "electron";

let launchIpynb;

const URL = require("url");

export function getPath(url) {
  if (url.startsWith("file:///")) {
    return URL.parse(url).pathname;
  }
  const nUrl = url.substring(url.indexOf("static"), path.length);
  return path.join(__dirname, "..", "..", nUrl.replace("static/", ""));
}

export function deferURL(event, url) {
  console.log("deferral");
  event.preventDefault();
  if (!url.startsWith("file:")) {
    shell.openExternal(url);
  } else if (url.endsWith(".ipynb")) {
    // TODO: Determine if `file://` already set up as if the user
    //       has clicked a notebook link within another notebook
    launchIpynb(getPath(url));
  }
}

const iconPath = path.join(__dirname, "..", "..", "static", "icon.png");

const initContextMenu = require("electron-context-menu");

// Setup right-click context menu for all BrowserWindows
initContextMenu();

export function launch(filename) {
  let win = new BrowserWindow({
    width: 800,
    height: 1000,
    icon: iconPath,
    title: "nteract"
  });

  const index = path.join(__dirname, "..", "..", "static", "index.html");
  win.loadURL(`file://${index}`);

  win.webContents.on("did-finish-load", () => {
    if (filename) {
      win.webContents.send("main:load", filename);
    }
    win.webContents.send("main:load-config");
  });

  win.webContents.on("will-navigate", deferURL);

  // Emitted when the window is closed.
  win.on("closed", () => {
    win = null;
  });
  return win;
}
launchIpynb = launch;

export function launchNewNotebook(kernelSpec) {
  const win = launch();
  win.webContents.on("did-finish-load", () => {
    win.webContents.send("main:new", kernelSpec);
  });
  return win;
}

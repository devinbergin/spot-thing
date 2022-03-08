// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

// This is all used for the minimize function
const electron = require("electron");
const ipc = electron.ipcRenderer;

const togmin = document.getElementById("min-button");

togmin.addEventListener("click", function() {
    ipc.send("toggle-minimize-window");
});
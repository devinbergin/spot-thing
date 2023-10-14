// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const ipc = require("electron").ipcMain;
const Store = require('electron-store');

const store = new Store();

// Set to 1 to turn on console logging
var debug = 0;

let mainWindow;

function createWindow () {
  	// Create the browser window.
  	mainWindow = new BrowserWindow({
		width: 530,
		height: 275,
		resizeable: false,
		autoHideMenuBar: true,
		frame: false,
		webPreferences: {
      		preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: true, 
            contextIsolation: false
    	}
  	})

  	// and load the index.html of the app.
  	mainWindow.loadFile('spot-thing.html')

  	// Open the dev tools of the main window in debug mode
  	debug && mainWindow.webContents.openDevTools()
  
	// Don't allow drag to resize window
  	//mainWindow.setResizable(false)

	// Set window to always be on top
	mainWindow.setAlwaysOnTop(true, 'screen');
	
	// Sent over from the renderer - minimize 
	ipc.on("toggle-minimize-window", function(event) {
        mainWindow.minimize();
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Function to create child window of parent one
function createAuthWindow(authorizeURL) {
	var authWindowURL;

	authWindow = new BrowserWindow({
		width: 1000,
		height: 700,
		modal: true,
		show: false,
		parent: mainWindow,
		autoHideMenuBar: false,
		frame: true,
		// Make sure to add webPreferences with below configuration
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true
		},
	});

	// Open the dev tools of the auth window in debug mode
	debug && authWindow.webContents.openDevTools()
	
	// Child window loads settings.html file
	authWindow.loadURL(authorizeURL);
	
	// This one should cover any future authorizations of the same app
	authWindow.once("ready-to-show", () => {
		authWindow.show();
		authWindowURL = authWindow.webContents.getURL();

		if (authWindowURL.includes('localhost') && !authWindowURL.includes('https://accounts.spotify.com')) {
			// We are authenticated, store the url
			store.set('authWindowURL', authWindowURL);
			debug && console.log('authWindowURL From Store: ' + store.get('authWindowURL'));

			authWindow.close();
		}
	});

	// This helps to cover the first authorization with Spotify
	authWindow.webContents.on('did-finish-load', function() {
		authWindowURL = authWindow.webContents.getURL();

		if (authWindowURL.includes('localhost') && !authWindowURL.includes('https://accounts.spotify.com')) {
			// We are authenticated, store the url
			store.set('authWindowURL', authWindowURL);
			debug && console.log('authWindowURL From Store: ' + store.get('authWindowURL'));

			authWindow.close();
		}
	});
}

// Listen for the createAuthWindow call from preload.js to spawn our new electron window for authorization
ipcMain.on("createAuthWindow", (event, arg) => {
	createAuthWindow(arg[0]);
});
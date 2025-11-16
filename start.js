const setupEvents = require('./installers/setupEvents')
 if (setupEvents.handleSquirrelEvent()) {
    return;
 }

console.log('Starting POS Application...');
const server = require('./server');
console.log('Express server module loaded');
const {app, BrowserWindow, ipcMain, screen} = require('electron');
const path = require('path')
const remoteMain = require('@electron/remote/main');
remoteMain.initialize();

const contextMenu = require('electron-context-menu');

let mainWindow

function createWindow() {
  var primaryDisplay = screen.getPrimaryDisplay();
  var screenDimensions = primaryDisplay.workAreaSize;
  mainWindow = new BrowserWindow({
    width: screenDimensions.width,
    height: screenDimensions.height,
    frame: false,
    minWidth: 1200, 
    minHeight: 750,
    
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false
    },
  });

  mainWindow.maximize();
  mainWindow.show();

  // Enable remote module for this window
  remoteMain.enable(mainWindow.webContents);
  console.log('Remote module enabled for main window');

  mainWindow.loadURL(
    `file://${path.join(__dirname, 'index.html')}`
  )

  // DevTools enabled for debugging
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}


app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})



ipcMain.on('app-quit', (evt, arg) => {
  app.quit()
})


ipcMain.on('app-reload', (event, arg) => {
  mainWindow.reload();
});



contextMenu({
  prepend: (params, browserWindow) => [
     
      {label: 'DevTools',
       click(item, focusedWindow){
        focusedWindow.toggleDevTools();
      }
    },
     { 
      label: "Reload", 
        click() {
          mainWindow.reload();
      } 
    // },
    // {  label: 'Quit',  click:  function(){
    //    mainWindow.destroy();
    //     mainWindow.quit();
    // } 
  }  
  ],

});

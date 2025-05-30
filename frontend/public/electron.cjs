
const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev'); 

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    
    icon: path.join(__dirname, 'logo.png'),
    webPreferences: {
      nodeIntegration: true, 
      contextIsolation: false, 
      
    },
  });

  

 
  win.loadURL(
    isDev
      ? 'http://localhost:5173' 
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  
  if (isDev) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
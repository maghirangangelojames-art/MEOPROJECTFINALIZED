import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import path from 'path';
import { isDev } from './utils';

let mainWindow: BrowserWindow | null = null;

// Create the browser window
function createWindow() {
  const iconPath = isDev
    ? path.join(__dirname, '..', 'electron', 'assets', 'icon.svg')
    : path.join(__dirname, 'icon.svg'); // Icon is in resources/app in production
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
    },
    icon: iconPath,
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:5173' // Vite dev server
    : `file://${path.join(__dirname, 'public', 'index.html')}`; // Production - bundled HTML

  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App event listeners
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  // On macOS, apps stay active until user quits explicitly
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

// Create application menu
function createMenu() {
  const template: (Electron.MenuItemConstructorOptions & { role?: any })[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About MEO Sariaya Permit System',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: 'About MEO Sariaya Permit System',
              message: 'MEO Sariaya Digital Building Permit System',
              detail: 'Version 1.0.0\n\nA comprehensive building permit management system.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on('ready', createMenu);

// IPC handlers for main process communication
ipcMain.handle('app-version', () => {
  return { version: app.getVersion() };
});

ipcMain.handle('open-file-dialog', async (event, options) => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: options?.filters || [],
  });

  return result.filePaths[0] || null;
});

ipcMain.handle('save-file-dialog', async (event, options) => {
  if (!mainWindow) return null;

  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: options?.defaultPath || 'document.pdf',
    filters: options?.filters || [],
  });

  return result.filePath || null;
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

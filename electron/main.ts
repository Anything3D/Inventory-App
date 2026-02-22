import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { initDatabase, getCategories, getItems, addItem, updateItem, deleteItem, getDashboardStats, updateCategory, addCategory, deleteCategory } from './db'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'fs'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

// Crash Logging
const logPath = path.join(app.getPath('documents'), 'inventory-v2-crash.log');

function log(message: string, level: 'INFO' | 'ERROR' = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${level}: ${message}\n`;
  try {
    fs.appendFileSync(logPath, logMessage);
  } catch (e) {
    console.error('Failed to write to log file:', e);
  }
}

// Global Error Handlers
process.on('uncaughtException', (error) => {
  log(error.stack || error.message, 'ERROR');
  dialog.showErrorBox('Unexpected Error', `An unexpected error occurred:\n\n${error.message}\n\nPlease check ${logPath} for details.`);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  log(reason.stack || reason, 'ERROR');
  dialog.showErrorBox('Unhandled Promise Rejection', `An unhandled promise rejection occurred:\n\n${reason}\n\nPlease check ${logPath} for details.`);
  process.exit(1);
});

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(async () => {
  try {
    log('App starting...');
    // Initialize DB - this catches early DB errors
    initDatabase((msg) => log(msg, 'INFO'));
    log('Database initialized.');

    // Helper for logging IPC calls
    const handleIpc = (channel: string, handler: (...args: any[]) => any) => {
      ipcMain.handle(channel, async (...args) => {
        try {
          // Log only mutation events or errors to avoid spamming read logs (optional, but good for now)
          if (!channel.startsWith('get-')) {
            log(`IPC Call: ${channel}`, 'INFO');
          }
          const result = await handler(...args);
          return result;
        } catch (error: any) {
          log(`IPC Error [${channel}]: ${error.message}`, 'ERROR');
          throw error;
        }
      });
    };

    handleIpc('get-categories', () => getCategories())
    handleIpc('get-items', (_event, categoryId) => getItems(categoryId))
    handleIpc('add-item', (_event, item) => addItem(item))
    handleIpc('update-item', (_event, id, item) => updateItem(id, item))
    handleIpc('delete-item', (_event, id) => deleteItem(id))
    handleIpc('update-category', (_event, id, category) => updateCategory(id, category))
    handleIpc('add-category', (_event, category) => addCategory(category))
    handleIpc('delete-category', (_event, id) => deleteCategory(id))
    handleIpc('get-dashboard-stats', () => getDashboardStats())

    createWindow()
    log('Main window created.');
  } catch (error: any) {
    log(error.stack || error.message, 'ERROR');
    dialog.showErrorBox('Startup Error', `Failed to start application:\n\n${error.message}`);
    app.quit();
  }
})

const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.NODE_ENV !== 'production'

// ── Persistent Data Storage Path ──────────────────────────────────────────
function getDataPath() {
  const userDataDir = app.getPath('userData')
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true })
  }
  return path.join(userDataDir, 'faculty-publications-data.json')
}

// ── IPC: Load Data ────────────────────────────────────────────────────────
ipcMain.handle('store:load', async () => {
  const filePath = getDataPath()
  try {
    if (!fs.existsSync(filePath)) {
      return { publications: [], faculty: [] }
    }
    const raw = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(raw)
    return {
      publications: Array.isArray(parsed.publications) ? parsed.publications : [],
      faculty: Array.isArray(parsed.faculty) ? parsed.faculty : [],
    }
  } catch (err) {
    console.error('[store:load] Error reading storage:', err)
    return { publications: [], faculty: [] }
  }
})

// ── IPC: Save Data ────────────────────────────────────────────────────────
ipcMain.handle('store:save', async (_event, data) => {
  const filePath = getDataPath()
  try {
    const toSave = {
      publications: Array.isArray(data?.publications) ? data.publications : [],
      faculty: Array.isArray(data?.faculty) ? data.faculty : [],
    }
    fs.writeFileSync(filePath, JSON.stringify(toSave, null, 2), 'utf-8')
    return { success: true }
  } catch (err) {
    console.error('[store:save] Error saving storage:', err)
    return { success: false, error: err.message }
  }
})

// ── IPC: Native File Save Dialog ──────────────────────────────────────────
ipcMain.handle('dialog:save-file', async (_event, { defaultFilename, content, filters }) => {
  try {
    const win = BrowserWindow.getFocusedWindow()
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Export File',
      defaultPath: path.join(app.getPath('documents'), defaultFilename || 'export.txt'),
      filters: filters || [
        { name: 'All Files', extensions: ['*'] }
      ],
    })

    if (canceled || !filePath) {
      return { canceled: true }
    }

    fs.writeFileSync(filePath, content, 'utf-8')
    return { success: true, filePath }
  } catch (err) {
    console.error('[dialog:save-file] Error saving file:', err)
    return { success: false, error: err.message }
  }
})

// ── Window Creation ───────────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    title: 'Faculty Publications Generator',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('appInfo', {
  version: '1.0.0',
})

contextBridge.exposeInMainWorld('electronAPI', {
  loadData: () => ipcRenderer.invoke('store:load'),
  saveData: (data) => ipcRenderer.invoke('store:save', data),
  saveExportFile: (options) => ipcRenderer.invoke('dialog:save-file', options),
})

// Legacy/Alternative store bridge
contextBridge.exposeInMainWorld('store', {
  load: () => ipcRenderer.invoke('store:load'),
  save: (data) => ipcRenderer.invoke('store:save', data),
})

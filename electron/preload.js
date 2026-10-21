// Preload script – context bridge for future IPC exposure.
// Currently empty; add contextBridge.exposeInMainWorld() here as needed.
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('appInfo', {
  version: '1.0.0',
})

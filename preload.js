const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSetting: (id, enable) => ipcRenderer.invoke('set-setting', { id, enable }),
  setAllSettings: (enable) => ipcRenderer.invoke('set-all-settings', enable),
  setCategorySettings: (category, enable) => ipcRenderer.invoke('set-category-settings', { category, enable })
});

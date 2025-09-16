const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const WinReg = require('winreg');

// --- New Exhaustive and Ordered Metadata Structure ---
const PRIVACY_SETTINGS = [
    // 1. Расположение
    { id: 'location_service', category: 'Расположение', name: 'Службы определения местоположения', description: 'Главный переключатель служб расположения для устройства.', hive: 'HKLM', path: '\\SYSTEM\\CurrentControlSet\\Services\\lfsvc\\Service\\Configuration', key: 'Status', type: 'REG_DWORD', enabledValue: 1, disabledValue: 0 },
    { id: 'location_apps', category: 'Расположение', name: 'Разрешить приложениям доступ к расположению', description: 'Управляет доступом приложений из магазина.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\location', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },
    { id: 'location_desktop', category: 'Расположение', name: 'Разрешить настольным приложениям доступ к расположению', description: 'Управляет доступом классических приложений.', hive: 'HKLM', path: '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\location\\NonPackaged', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 2. Камера
    { id: 'camera_master', category: 'Камера', name: 'Доступ к камере', description: 'Главный переключатель доступа к камере на устройстве.', hive: 'HKLM', path: '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\webcam', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },
    { id: 'camera_desktop', category: 'Камера', name: 'Разрешить настольным приложениям доступ к камере', description: 'Управляет доступом классических приложений.', hive: 'HKLM', path: '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\webcam\\NonPackaged', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 3. Микрофон
    { id: 'microphone_master', category: 'Микрофон', name: 'Доступ к микрофону', description: 'Главный переключатель доступа к микрофону на устройстве.', hive: 'HKLM', path: '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },
    { id: 'microphone_desktop', category: 'Микрофон', name: 'Разрешить настольным приложениям доступ к микрофону', description: 'Управляет доступом классических приложений.', hive: 'HKLM', path: '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone\\NonPackaged', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 4. Голосовая активация
    { id: 'voiceActivation_apps', category: 'Голосовая активация', name: 'Разрешить приложениям доступ к службам голосовой активации', description: 'Позволяет приложениям быть активированными с помощью голоса.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\voiceActivation', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 5. Уведомления
    { id: 'notifications_master', category: 'Уведомления', name: 'Доступ к уведомлениям', description: 'Главный переключатель для всех уведомлений.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings', key: 'Enabled', type: 'REG_DWORD', enabledValue: 1, disabledValue: 0 },
    { id: 'notifications_apps', category: 'Уведомления', name: 'Разрешить приложениям доступ к уведомлениям', description: 'Позволяет приложениям читать все уведомления.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\userNotificationListener', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 6. Сведения учетной записи
    { id: 'accountInfo_apps', category: 'Сведения учетной записи', name: 'Разрешить приложениям доступ к сведениям', description: 'Управляет доступом приложений к имени, аватару и т.д.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\userAccountInformation', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 7. Контакты
    { id: 'contacts_apps', category: 'Контакты', name: 'Разрешить приложениям доступ к контактам', description: 'Управляет доступом приложений к списку контактов.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\contacts', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 8. Календарь
    { id: 'calendar_apps', category: 'Календарь', name: 'Разрешить приложениям доступ к календарю', description: 'Управляет доступом приложений к календарю.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\appointments', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 9. Телефонные звонки
    { id: 'phoneCalls_apps', category: 'Телефонные звонки', name: 'Разрешить приложениям совершать звонки', description: 'Управляет возможностью приложений совершать звонки.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\phoneCall', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 10. Журнал вызовов
    { id: 'callHistory_apps', category: 'Журнал вызовов', name: 'Разрешить приложениям доступ к журналу вызовов', description: 'Управляет доступом приложений к истории звонков.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\phoneCallHistory', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 11. Электронная почта
    { id: 'email_apps', category: 'Электронная почта', name: 'Разрешить приложениям доступ к почте', description: 'Управляет доступом приложений к почте и ее отправке.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\email', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 12. Задачи
    { id: 'tasks_apps', category: 'Задачи', name: 'Разрешить приложениям доступ к задачам', description: 'Управляет доступом приложений к задачам.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\tasks', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 13. Обмен сообщениями
    { id: 'messaging_apps', category: 'Обмен сообщениями', name: 'Разрешить приложениям читать сообщения', description: 'Управляет доступом приложений к текстовым сообщениям.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\chat', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 14. Радио
    { id: 'radios_apps', category: 'Радио', name: 'Разрешить приложениям управлять радиомодулями', description: 'Управляет доступом приложений к Bluetooth, Wi-Fi.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\radios', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 15. Другие устройства
    { id: 'otherDevices_apps', category: 'Другие устройства', name: 'Обмен данными с не связанными устройствами', description: 'Разрешает приложениям синхронизироваться с маячками, браслетами и т.д.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\bluetoothSync', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 16. Диагностика приложения
    { id: 'appDiagnostics_apps', category: 'Диагностика приложения', name: 'Разрешить приложениям доступ к диагностическим данным', description: 'Позволяет приложениям собирать данные о других приложениях.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\appDiagnostics', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 17. Автоматическое скачивание файлов
    { id: 'backgroundAccess_apps', category: 'Автоматическое скачивание файлов', name: 'Разрешить приложениям скачивать файлы в фоновом режиме', description: 'Управляет фоновыми загрузками.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\backgroundAccess', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 18. Документы
    { id: 'documentsLibrary', category: 'Документы', name: 'Доступ к библиотеке документов', description: 'Разрешает приложениям доступ к документам.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\documentsLibrary', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 19. Папка загрузок
    { id: 'downloadsFolder', category: 'Папка загрузок', name: 'Доступ к папке загрузок', description: 'Разрешает приложениям доступ к файлам в папке загрузок.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\downloadsFolder', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 20. Фонотека
    { id: 'musicLibrary', category: 'Фонотека', name: 'Доступ к музыкальной библиотеке', description: 'Разрешает приложениям доступ к музыке.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\musicLibrary', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 21. Изображения
    { id: 'picturesLibrary', category: 'Изображения', name: 'Доступ к библиотеке изображений', description: 'Разрешает приложениям доступ к изображениям.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\picturesLibrary', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 22. Видео
    { id: 'videosLibrary', category: 'Видео', name: 'Доступ к библиотеке видео', description: 'Разрешает приложениям доступ к видео.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\videosLibrary', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 23. Файловая система
    { id: 'broadFileSystemAccess', category: 'Файловая система', name: 'Доступ к файловой системе', description: 'Разрешает приложениям доступ ко всем вашим файлам.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\broadFileSystemAccess', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 24. Рамка снимка экрана
    { id: 'screenCaptureBorder', category: 'Рамка снимка экрана', name: 'Разрешить приложениям отключать рамку снимка экрана', description: 'Управляет доступом приложений к параметрам границы снимка экрана.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\screenCapture', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },

    // 25. Снимки экрана и приложения
    { id: 'screenCaptureApps', category: 'Снимки экрана и приложения', name: 'Разрешить приложениям делать снимки экрана', description: 'Управляет возможностью приложений делать снимки различных окон и дисплеев.', hive: 'HKCU', path: '\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\appCaptureSettings', key: 'Value', type: 'REG_SZ', enabledValue: 'Allow', disabledValue: 'Deny' },
];

async function getPrivacySettings() {
    const settingsStatus = [];
    for (const setting of PRIVACY_SETTINGS) {
        const regKey = new WinReg({ hive: WinReg[setting.hive], key: setting.path });
        const status = await new Promise(resolve => {
            regKey.get(setting.key, (err, item) => {
                if (err || !item) {
                    resolve('disabled');
                } else {
                    const value = (setting.type === 'REG_DWORD') ? parseInt(item.value, 16) : item.value;
                    const isEnabled = value === setting.enabledValue;
                    resolve(isEnabled ? 'enabled' : 'disabled');
                }
            });
        });
        settingsStatus.push({ ...setting, status });
    }
    // No longer sorting alphabetically to respect the defined order
    return settingsStatus;
}

async function setPrivacySetting(id, enable) {
    const setting = PRIVACY_SETTINGS.find(s => s.id === id);
    if (!setting) throw new Error(`Setting with id ${id} not found.`);

    const value = enable ? setting.enabledValue : setting.disabledValue;
    const regKey = new WinReg({ hive: WinReg[setting.hive], key: setting.path });

    return new Promise((resolve, reject) => {
        regKey.keyExists((err, exists) => {
            if (err) return reject(err);
            const operation = (exists) 
                ? (cb) => regKey.set(setting.key, setting.type, value, cb)
                : (cb) => { regKey.create(() => regKey.set(setting.key, setting.type, value, cb)); };

            operation((err) => {
                if (err) {
                    if (err.code === 5) return reject(new Error('Permission denied. Please run as administrator.'));
                    return reject(err);
                }
                resolve({ success: true, id: id, status: enable ? 'enabled' : 'disabled' });
            });
        });
    });
}

async function setAllSettings(enable) {
    const promises = PRIVACY_SETTINGS.map(setting => setPrivacySetting(setting.id, enable));
    try {
        await Promise.all(promises);
        return { success: true };
    } catch (error) {
        console.error('Error in setAllSettings:', error);
        throw error;
    }
}

async function setCategorySettings(category, enable) {
    const settingsInCategory = PRIVACY_SETTINGS.filter(s => s.category === category);
    const promises = settingsInCategory.map(setting => setPrivacySetting(setting.id, enable));
    try {
        await Promise.all(promises);
        return { success: true };
    } catch (error) {
        console.error(`Error in setCategorySettings for ${category}:`, error);
        throw error;
    }
}

/*
async function applyVisualEffects() {
    console.log('Attempting to apply visual effects (granular method)...');
    const setKey = (hive, path, key, type, value) => {
        return new Promise((resolve, reject) => {
            const regKey = new WinReg({ hive: WinReg[hive], key: path }); // Corrected hive usage
            console.log(`Setting key: ${hive}\\${path}\\${key} to value: ${value} (type: ${type})`);
            regKey.set(key, type, value, (err) => {
                if (err) {
                    console.error(`Failed to set key ${key}:`, err);
                    if (err.code === 5) {
                        console.warn(`Permission denied for visual effect: ${key}. Skipping.`);
                        return resolve(); 
                    }
                    return reject(err);
                }
                console.log(`Successfully set key: ${key}`);
                resolve();
            });
        });
    };

    try {
        // 1. Set to Custom Effects
        await setKey('HKCU', '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects', 'VisualFxSetting', WinReg.REG_DWORD, 3);

        // 2. Set individual VisualFX_X keys based on Screenshot_31.png
        // Checked (Set to 0)
        await setKey('HKCU', '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects', 'VisualFX_5', WinReg.REG_DWORD, 0); // Вывод эскизов вместо значков
        await setKey('HKCU', '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects', 'VisualFX_1', WinReg.REG_DWORD, 0); // Отображение теней, отбрасываемых окнами
        await setKey('HKCU', '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects', 'VisualFX_6', WinReg.REG_DWORD, 0); // Сглаживание неровностей экранных шрифтов

        // Unchecked (Set to 1)
        await setKey('HKCU', '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects', 'VisualFX_8', WinReg.REG_DWORD, 1); // Анимация на панели задач
        await setKey('HKCU', '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects', 'VisualFX_0', WinReg.REG_DWORD, 1); // Анимация окон при свертывании и развертывании
        await setKey('HKCU', '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects', 'VisualFX_2', WinReg.REG_DWORD, 1); // Анимированные элементы управления
        await setKey('HKCU', '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects', 'VisualFX_7', WinReg.REG_DWORD, 1); // Включение Peek
        await setKey('HKCU', '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects', 'VisualFX_3', WinReg.REG_DWORD, 1); // Гладкое прокручивание списков
        await setKey('HKCU', '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects', 'VisualFX_4', WinReg.REG_DWORD, 1); // Затухание меню после вызова команды
        await setKey('HKCU', '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects', 'VisualFX_9', WinReg.REG_DWORD, 1); // Отбрасывание теней значками на рабочем столе
        await setKey('HKCU', '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects', 'VisualFX_10', WinReg.REG_DWORD, 1); // Отображение прозрачного прямоугольника выделения
        await setKey('HKCU', '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects', 'VisualFX_11', WinReg.REG_DWORD, 1); // Отображение содержимого окна при перетаскивании
        await setKey('HKCU', '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects', 'VisualFX_12', WinReg.REG_DWORD, 1); // Отображение тени под указателем мыши
        await setKey('HKCU', '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects', 'VisualFX_13', WinReg.REG_DWORD, 1); // Скольжение при раскрытии списков
        await setKey('HKCU', '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects', 'VisualFX_14', WinReg.REG_DWORD, 1); // Сохранение вида эскизов панели задач
        await setKey('HKCU', '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects', 'VisualFX_15', WinReg.REG_DWORD, 1); // Эффекты затухания или скольжения при обращении к меню
        await setKey('HKCU', '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects', 'VisualFX_16', WinReg.REG_DWORD, 1); // Эффекты затухания или скольжения при появлении подсказок

        // 3. Handle other specific keys not under VisualEffects
        await setKey('HKCU', '\\Control Panel\\Desktop', 'FontSmoothing', WinReg.REG_SZ, '2'); // Сглаживание неровностей экранных шрифтов (separate key)
        await setKey('HKCU', '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', 'IconsOnly', WinReg.REG_DWORD, 0); // Вывод эскизов вместо значков (separate key)
        await setKey('HKCU', '\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced', 'ListviewShadow', WinReg.REG_DWORD, 1); // Отбрасывание теней значками на рабочем столе (separate key)

        // Refresh Explorer shell to apply changes
        // Using separate exec calls and a timeout to prevent blocking
        require('child_process').exec('taskkill /f /im explorer.exe', (err, stdout, stderr) => {
            if (err) {
                console.error('Error killing explorer.exe:', err);
            }
            setTimeout(() => {
                require('child_process').exec('start explorer.exe', (err, stdout, stderr) => {
                    if (err) {
                        console.error('Error starting explorer.exe:', err);
                    }
                });
            }, 1000); // Small delay to allow explorer to fully terminate
        });

        console.log('All visual effects settings attempted (granular method).');
        return { success: true };
    } catch (error) {
        console.error('Critical error applying visual effects (granular method):', error);
        throw error;
    }
}
*/


function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

  win.loadFile('index.html');
  win.removeMenu();
  // Optional: Open DevTools for debugging
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
    ipcMain.handle('get-settings', getPrivacySettings);
    ipcMain.handle('set-setting', (event, { id, enable }) => setPrivacySetting(id, enable));
    ipcMain.handle('set-all-settings', (event, enable) => setAllSettings(enable));
    ipcMain.handle('set-category-settings', (event, { category, enable }) => setCategorySettings(category, enable));

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

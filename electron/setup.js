"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupContentSecurityPolicy = exports.ElectronCapacitorApp = exports.setupReloadWatcher = void 0;
const tslib_1 = require("tslib");
const electron_1 = require("@capacitor-community/electron");
const chokidar_1 = tslib_1.__importDefault(require("chokidar"));
const electron_2 = require("electron");
const electron_is_dev_1 = tslib_1.__importDefault(require("electron-is-dev"));
const electron_serve_1 = tslib_1.__importDefault(require("electron-serve"));
const electron_window_state_1 = tslib_1.__importDefault(require("electron-window-state"));
const path_1 = require("path");
//ipc main - to communicate and send to preload -> capacitor app
const electron_3 = require("electron");
//child process - key & mouse handler
const path = tslib_1.__importStar(require("path"));
const child_process_1 = require("child_process");
// Define components for a watcher to detect when the webapp is changed so we can reload in Dev mode.
const reloadWatcher = {
    debouncer: null,
    ready: false,
    watcher: null,
};
function setupReloadWatcher(electronCapacitorApp) {
    reloadWatcher.watcher = chokidar_1.default
        .watch(path_1.join(electron_2.app.getAppPath(), 'app'), {
        ignored: /[/\\]\./,
        persistent: true,
    })
        .on('ready', () => {
        reloadWatcher.ready = true;
    })
        .on('all', (_event, _path) => {
        if (reloadWatcher.ready) {
            clearTimeout(reloadWatcher.debouncer);
            reloadWatcher.debouncer = setTimeout(async () => {
                electronCapacitorApp.getMainWindow().webContents.reload();
                reloadWatcher.ready = false;
                clearTimeout(reloadWatcher.debouncer);
                reloadWatcher.debouncer = null;
                reloadWatcher.watcher = null;
                setupReloadWatcher(electronCapacitorApp);
            }, 1500);
        }
    });
}
exports.setupReloadWatcher = setupReloadWatcher;
// Define our class to manage our app.
class ElectronCapacitorApp {
    constructor(capacitorFileConfig, trayMenuTemplate, appMenuBarMenuTemplate) {
        var _a, _b;
        this.MainWindow = null;
        this.SplashScreen = null;
        this.TrayIcon = null;
        this.TrayMenuTemplate = [
            new electron_2.MenuItem({ label: 'Quit App', role: 'quit' }),
        ];
        this.AppMenuBarMenuTemplate = [
            { role: process.platform === 'darwin' ? 'appMenu' : 'fileMenu' },
            { role: 'viewMenu' },
        ];
        /* activity counters */
        this.alphaNumPressCount = 0;
        this.copyPasteCount = 0;
        this.actionKeyPressCount = 0;
        this.leftClickCount = 0;
        this.rightClickCount = 0;
        this.mouseDisplacementSum = 0;
        this.mouseScrollSum = 0;
        /* setting veriables */
        this.coderActivityListenerProcess = null; //chilp process holder
        this.previousMousePos = { x: 0, y: 0 };
        this.previousMouseScroll = 0;
        // private previousInKeyCode: string = '';
        this.previousActionKeyCode = '';
        this.message = '';
        this.alphanumKeyCodes = [
            '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90', '96', '97', '98', '99', '100', '101', '102', '103', '104', '105'
        ];
        this.CapacitorFileConfig = capacitorFileConfig;
        this.customScheme = (_b = (_a = this.CapacitorFileConfig.electron) === null || _a === void 0 ? void 0 : _a.customUrlScheme) !== null && _b !== void 0 ? _b : 'infinityprop-infinitycoder';
        if (trayMenuTemplate) {
            this.TrayMenuTemplate = trayMenuTemplate;
        }
        if (appMenuBarMenuTemplate) {
            this.AppMenuBarMenuTemplate = appMenuBarMenuTemplate;
        }
        // Setup our web app loader, this lets us load apps like react, vue, and angular without changing their build chains.
        this.loadWebApp = electron_serve_1.default({
            directory: path_1.join(electron_2.app.getAppPath(), 'app'),
            scheme: this.customScheme,
        });
    }
    // Helper function to load in the app.
    async loadMainWindow(thisRef) {
        await thisRef.loadWebApp(thisRef.MainWindow);
    }
    // Expose the mainWindow ref for use outside of the class.
    getMainWindow() {
        return this.MainWindow;
    }
    getCustomURLScheme() {
        return this.customScheme;
    }
    async init() {
        var _a, _b, _c, _d;
        const icon = electron_2.nativeImage.createFromPath(path_1.join(electron_2.app.getAppPath(), 'assets', process.platform === 'win32' ? 'appIcon.ico' : 'appIcon.png'));
        this.mainWindowState = electron_window_state_1.default({
            defaultWidth: 1000,
            defaultHeight: 800,
        });
        // Setup preload script path and construct our main window.
        const preloadPath = path_1.join(electron_2.app.getAppPath(), 'build', 'src', 'preload.js');
        this.MainWindow = new electron_2.BrowserWindow({
            icon,
            show: false,
            x: this.mainWindowState.x,
            y: this.mainWindowState.y,
            width: this.mainWindowState.width,
            height: this.mainWindowState.height,
            frame: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: true,
                // Use preload to inject the electron varriant overrides for capacitor plugins.
                // preload: join(app.getAppPath(), "node_modules", "@capacitor-community", "electron", "dist", "runtime", "electron-rt.js"),
                preload: preloadPath,
            },
        });
        this.mainWindowState.manage(this.MainWindow);
        if (this.CapacitorFileConfig.backgroundColor) {
            this.MainWindow.setBackgroundColor(this.CapacitorFileConfig.electron.backgroundColor);
        }
        // If we close the main window with the splashscreen enabled we need to destory the ref.
        this.MainWindow.on('closed', () => {
            var _a;
            if (((_a = this.SplashScreen) === null || _a === void 0 ? void 0 : _a.getSplashWindow()) && !this.SplashScreen.getSplashWindow().isDestroyed()) {
                this.SplashScreen.getSplashWindow().close();
            }
        });
        // When the tray icon is enabled, setup the options.
        if ((_a = this.CapacitorFileConfig.electron) === null || _a === void 0 ? void 0 : _a.trayIconAndMenuEnabled) {
            this.TrayIcon = new electron_2.Tray(icon);
            this.TrayIcon.on('double-click', () => {
                if (this.MainWindow) {
                    if (this.MainWindow.isVisible()) {
                        this.MainWindow.hide();
                    }
                    else {
                        this.MainWindow.show();
                        this.MainWindow.focus();
                    }
                }
            });
            this.TrayIcon.on('click', () => {
                if (this.MainWindow) {
                    if (this.MainWindow.isVisible()) {
                        this.MainWindow.hide();
                    }
                    else {
                        this.MainWindow.show();
                        this.MainWindow.focus();
                    }
                }
            });
            this.TrayIcon.setToolTip(electron_2.app.getName());
            this.TrayIcon.setContextMenu(electron_2.Menu.buildFromTemplate(this.TrayMenuTemplate));
        }
        // Setup the main manu bar at the top of our window.
        electron_2.Menu.setApplicationMenu(electron_2.Menu.buildFromTemplate(this.AppMenuBarMenuTemplate));
        // If the splashscreen is enabled, show it first while the main window loads then dwitch it out for the main window, or just load the main window from the start.
        if ((_b = this.CapacitorFileConfig.electron) === null || _b === void 0 ? void 0 : _b.splashScreenEnabled) {
            this.SplashScreen = new electron_1.CapacitorSplashScreen({
                imageFilePath: path_1.join(electron_2.app.getAppPath(), 'assets', (_d = (_c = this.CapacitorFileConfig.electron) === null || _c === void 0 ? void 0 : _c.splashScreenImageName) !== null && _d !== void 0 ? _d : 'splash.png'),
                windowWidth: 400,
                windowHeight: 400,
            });
            this.SplashScreen.init(this.loadMainWindow, this);
        }
        else {
            this.loadMainWindow(this);
        }
        // Security
        this.MainWindow.webContents.setWindowOpenHandler((details) => {
            if (!details.url.includes(this.customScheme)) {
                return { action: 'deny' };
            }
            else {
                return { action: 'allow' };
            }
        });
        this.MainWindow.webContents.on('will-navigate', (event, _newURL) => {
            if (!this.MainWindow.webContents.getURL().includes(this.customScheme)) {
                event.preventDefault();
            }
        });
        // Link electron plugins into the system.
        electron_1.setupCapacitorElectronPlugins();
        // When the web app is loaded we hide the splashscreen if needed and show the mainwindow.
        this.MainWindow.webContents.on('dom-ready', () => {
            var _a, _b;
            if ((_a = this.CapacitorFileConfig.electron) === null || _a === void 0 ? void 0 : _a.splashScreenEnabled) {
                this.SplashScreen.getSplashWindow().hide();
            }
            if (!((_b = this.CapacitorFileConfig.electron) === null || _b === void 0 ? void 0 : _b.hideMainWindowOnLaunch)) {
                this.MainWindow.show();
            }
            setTimeout(() => {
                if (electron_is_dev_1.default) {
                    this.MainWindow.webContents.openDevTools();
                }
                electron_1.CapElectronEventEmitter.emit('CAPELECTRON_DeeplinkListenerInitialized', '');
            }, 400);
        });
        /** ipcMain handler for handling ipc messages */
        electron_3.ipcMain.handle('startCoderActivityListener', async (event, args) => {
            return new Promise((resolve, reject) => {
                try {
                    StartCoderActivityListener();
                    resolve({ 'startCoderActivityListenerRes': 'true' });
                }
                catch (err) {
                    reject({ 'startCoderActivityListenerRes': err + '_false' });
                }
            });
        });
        electron_3.ipcMain.handle('getCoderActivityData', async (event, args) => {
            return new Promise((resolve, reject) => {
                resolve({
                    'alphaNumPressCount': Math.round(this.alphaNumPressCount),
                    'copyPasteCount': Math.round(this.copyPasteCount),
                    'actionKeyPressCount': Math.round(this.actionKeyPressCount),
                    'leftClickCount': Math.round(this.leftClickCount),
                    'rightClickCount': Math.round(this.rightClickCount),
                    'mouseDisplacementSum': Math.round(this.mouseDisplacementSum),
                    'mouseScrollSum': Math.round(this.mouseScrollSum)
                });
            });
        });
        electron_3.ipcMain.handle('stopCoderActivityListener', async (event, args) => {
            return new Promise((resolve, reject) => {
                try {
                    StopCoderActivityListener();
                    resolve({ 'stopCoderActivityListenerRes': 'true' });
                }
                catch (err) {
                    reject({ 'stopCoderActivityListenerRes': err + '_false' });
                }
            });
        });
        electron_3.ipcMain.handle('getCoderActivityMessage', async (event, args) => {
            return new Promise((resolve, reject) => {
                try {
                    resolve({ 'getCoderActivityMessage': this.message });
                }
                catch (err) {
                    reject({ 'getCoderActivityMessage': err + '_false' });
                }
            });
        });
        electron_3.ipcMain.handle('exitApp', async (event, args) => {
            return new Promise((resolve, reject) => {
                try {
                    electron_2.app.quit();
                    resolve({ 'exitAppRes': 'true' });
                }
                catch (err) {
                    reject({ 'exitAppRes': err + '_false' });
                }
            });
        });
        const StartCoderActivityListener = () => {
            /** child process */
            this.coderActivityListenerProcess = child_process_1.fork(path.join(__dirname, 'key-logger-ext/server.js'));
            this.coderActivityListenerProcess.send('directory>' + __dirname);
            this.coderActivityListenerProcess.on('error', (res) => {
                console.log('childError:' + res);
            });
            this.coderActivityListenerProcess.on('message', (res) => {
                const datas = JSON.stringify(res).split(',');
                let currentMousePos = { x: null, y: null };
                let currentMouseScroll = null;
                datas.map((data) => {
                    if (data.includes('key')) {
                        const inKeyCode = data.split(':')[1].replace(/[\s\"]/g, '');
                        //this.message = inKeyCode;
                        if (CheckIsAlphaNum(inKeyCode)) {
                            this.message = 'isAlphaNum';
                            this.previousActionKeyCode = '';
                            this.alphaNumPressCount += 0.5;
                        }
                        else if (CheckIsCopyPaste(inKeyCode)) {
                            this.message = 'isCopyPaste';
                            this.copyPasteCount += 0.5;
                        }
                        else {
                            this.message = 'isActionKey: ' + inKeyCode;
                            this.previousActionKeyCode = inKeyCode;
                            this.actionKeyPressCount += 0.5;
                        }
                        // this.previousInKeyCode = inKeyCode; ---deprecated
                    }
                    else if (data.includes('mouseClickLeft'))
                        this.leftClickCount += 0.5;
                    else if (data.includes('mouseClickRight'))
                        this.rightClickCount += 0.5;
                    else if (data.includes('mouseX'))
                        currentMousePos.x = parseFloat(data.split(':')[1]);
                    else if (data.includes('mouseY'))
                        currentMousePos.y = parseFloat(data.split(':')[1]);
                    else if (data.includes('mouseScroll'))
                        currentMouseScroll = parseFloat(data.split(':')[1]);
                });
                if (currentMousePos.x != null && currentMousePos.y != null) {
                    const mouseDisplacement = CalculateEuclideanDistance(currentMousePos.x, currentMousePos.y, this.previousMousePos.x, this.previousMousePos.y);
                    this.mouseDisplacementSum += mouseDisplacement / 1000; /* divide by 1000 to scale down */
                    this.previousMousePos = currentMousePos;
                }
                if (currentMouseScroll != null) {
                    const scrollDisplacement = Math.abs((currentMouseScroll - this.previousMouseScroll));
                    this.mouseScrollSum += scrollDisplacement;
                    this.previousMouseScroll = currentMouseScroll;
                }
            });
            this.coderActivityListenerProcess.on('exit', function () {
                console.log('child process exit..');
            });
            this.coderActivityListenerProcess.on('data', function (res) {
                console.log('childData:' + res);
            });
        };
        const StopCoderActivityListener = () => {
            this.coderActivityListenerProcess.kill();
            this.coderActivityListenerProcess = null;
            ResetCoderActivityData();
        };
        const CalculateEuclideanDistance = (x1, y1, x2, y2) => {
            // Calculate the differences in x and y coordinates
            const dx = x2 - x1;
            const dy = y2 - y1;
            // Calculate the Euclidean distance (displacement)
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance;
        };
        const CheckIsAlphaNum = (keyCode) => {
            let isAlphaNum = false;
            if (keyCode != '86' ||
                (this.previousActionKeyCode != '17' && this.previousActionKeyCode != '162' && this.previousActionKeyCode != '163')) {
                this.alphanumKeyCodes.map((_keyCode) => {
                    if (keyCode == _keyCode)
                        isAlphaNum = true;
                });
            }
            return isAlphaNum;
        };
        const CheckIsCopyPaste = (keyCode) => {
            let isCopyPaste = false;
            if ((this.previousActionKeyCode == '17' || this.previousActionKeyCode == '162' || this.previousActionKeyCode == '163') &&
                keyCode == '86')
                isCopyPaste = true;
            return isCopyPaste;
        };
        const ResetCoderActivityData = () => {
            this.alphaNumPressCount = 0;
            this.copyPasteCount = 0;
            this.actionKeyPressCount = 0;
            this.leftClickCount = 0;
            this.rightClickCount = 0;
            this.mouseDisplacementSum = 0;
            this.mouseScrollSum = 0;
        };
    }
}
exports.ElectronCapacitorApp = ElectronCapacitorApp;
// Set a CSP up for our application based on the custom scheme
function setupContentSecurityPolicy(customScheme) {
    electron_2.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: Object.assign(Object.assign({}, details.responseHeaders), { 'Content-Security-Policy': [
                    electron_is_dev_1.default
                        ? `default-src ${customScheme}://* 'unsafe-inline' devtools://* 'unsafe-eval' http://* 'unsafe-eval' https:// 'unsafe-eval' data:`
                        : `default-src ${customScheme}://* 'unsafe-inline' http://* 'unsafe-eval' https://* 'unsafe-eval' data:`,
                ] }),
        });
    });
}
exports.setupContentSecurityPolicy = setupContentSecurityPolicy;

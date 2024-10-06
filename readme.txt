////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
the /capacitor folder holds the file for ionic capacitor to communicate with electron.

File: ElectronHome.tsx //capacitor entry points called to communicate with electron
Method Entry Points Establishment:
	window.electron.StartCoderActivityListener()
	window.electron.StopCoderActivityListener()
	window.electron.GetCoderActivityData()

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
the /electron folder holds the file for electron communicate with key-reader-logger script and to ionic capacitor application.

File: preload.js //define the interface between electron entry points and capacitor entry points.
Entry Points Definition:
	GetCoderActivityData: () => { return ipcRenderer.invoke('getCoderActivityData'); }
	StartCoderActivityListener: () => { return ipcRenderer.invoke('startCoderActivityListener'); }
	StopCoderActivityListener: () => { return ipcRenderer.invoke('stopCoderActivityListener'); }
	GetCoderActivityMessage: () => { return ipcRenderer.invoke('getCoderActivityMessage'); }
	ExitApp: () => { return ipcRenderer.invoke('exitApp'); }

File: setup.js //electron method definitions and entry points callout to communicate with capacitor
Method Defined:
	StartCoderActivityListener();
	StopCoderActivityListener();
Method Entry Points Establishment:
	electron_3.ipcMain.handle('startCoderActivityListener', (...) => {...});
	electron_3.ipcMain.handle('stopCoderActivityListener', (...) => {...});
	electron_3.ipcMain.handle('getCoderActivityMessage', (...) => {...});
	electron_3.ipcMain.handle('exitApp', (...) => {...});
	electron_3.ipcMain.handle('getCoderActivityData', (...) => {...});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
the /keyReaderLogger folder holds the files for key-reader-logger to communicate with electron.

File: kHook.exe //establish hook actions on windows to listen to keypress and mouse activity, the program is from https://unpkg.com/browse/key-reader-logger@1.0.1-d/

File: server.js //using key-reader-logger from https://unpkg.com/browse/key-reader-logger@1.0.1-d/
spawn childprocess to keep watch on user's keypress and mouse activity, then provides an entry points to communicate with electron

Entry Points:
	kLog.on("keyData", (data) => {...});
	kLog.on("mouseData", (data) => {...});


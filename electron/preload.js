require('./rt/electron-rt');
//////////////////////////////
// User Defined Preload scripts below
// import * as path from 'path';
// import { fork } from 'child_process';
// try {
//     const child = fork(path.join(__dirname, 'key-logger-ext/server.js'));
//     child.send('directory>' + __dirname);
//     child.on('error', (res) => {
//         console.log('childError:' + res);
//     });
//     child.on('message', (res) => {
//         console.log('childMessage:' + res);
//     });
//     child.on('exit', function() {
//         console.log('child process exit..');
//     });
//     child.on('data', function(res) {
//         console.log('childData:' + res);
//     });
// } catch(err) {
//     console.log('some error!: ' + err);
// } ---move to setup.ts to handle keyCounter
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electron', {
    // GetAppReady : () => {return ipcRenderer.invoke('getAppReady', 'true');},
    // globalShortcut: {
    //     register: (key) => {
    //         return ipcRenderer.invoke('globalShortcutRegister', [key]); 
    //     }
    // }
    GetCoderActivityData: () => { return ipcRenderer.invoke('getCoderActivityData'); },
    StartCoderActivityListener: () => { return ipcRenderer.invoke('startCoderActivityListener'); },
    StopCoderActivityListener: () => { return ipcRenderer.invoke('stopCoderActivityListener'); },
    GetCoderActivityMessage: () => { return ipcRenderer.invoke('getCoderActivityMessage'); },
    ExitApp: () => { return ipcRenderer.invoke('exitApp'); }
});

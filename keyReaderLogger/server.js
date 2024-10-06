//import * as http from 'http';
import { KeyReaderLogger } from 'key-reader-logger';
var kLog;
kLog = new KeyReaderLogger();

try {
  process.on('message', (res) => {
    if(res.includes('directory>')) {
      const path = res.split('>')[1];
      // kLog.startKeyboard(path);
      // kLog.startMouse(path);
      kLog.startAll(path);
      
      kLog.on("keyData", (data) => {
        const keyCode = data.split(/\r?\n/)[1].split(':')[1];
        log('key:' + keyCode);
      });

      kLog.on("mouseData", (data) => {
        const mouseData = data.split(/\r?\n/);
        const _mouseData = [];
        mouseData.map((data) => {
          const label = data.split(':')[0];
          const _data = data.split(':')[1];
          switch(label) {
            case 'x':
              _mouseData.push('mouseX:' + _data);
              break;
            case 'y':
              _mouseData.push('mouseY:' + _data);
              break;
            case 'leftKey':
              _mouseData.push('mouseClickLeft:' + _data);
              break;
            case 'rightKey':
              _mouseData.push('mouseClickRight:' + _data);
              break;
            case 'scrollDirection':
              _mouseData.push('mouseScroll:' + _data);
              break;
          }
        });
        log(_mouseData.join(','));
      });
  
      kLog.on('error', (err) => {
        log('kLogErr: ' + err);
      });
    }
  });

} catch(err) {
  log('mainErr: ' + err);
}

function log(message) {
  try {
    process.send(message);
  } catch(err) {
    console.log(message);
  }
}
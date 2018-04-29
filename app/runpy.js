const electron = require('electron');
const path = require('path')
var fs = require('fs');

var APP_PATH = electron.remote.getGlobal('APP_PATH')

const PY_DIST_FOLDER = 'pycalcdist'
const PY_FOLDER = 'pycalc'
const PY_MODULE = 'proto_v2' // without .py suffix

let pyProc = null

const guessPackaged = () => {
  const fullPath = path.join(APP_PATH, PY_DIST_FOLDER)
  return fs.existsSync(fullPath)
}

const getScriptPath = () => {
  if (!guessPackaged()) {
      return path.join(APP_PATH, PY_FOLDER, PY_MODULE + '.py')
  }
  if (process.platform === 'win32') {
    return path.join(APP_PATH, PY_DIST_FOLDER, PY_MODULE, PY_MODULE + '.exe')
  }
  return path.join(APP_PATH, PY_DIST_FOLDER, PY_MODULE, PY_MODULE)
}

const createPyProc = () => {
  let script = getScriptPath()

  var dataString = ''
  if (!guessPackaged()) {
      var spawn = require("child_process").spawn; 
      var mbox_path = electron.remote.getGlobal('sharedObject').MBOX_PATH;
      var save_path = electron.remote.getGlobal('sharedObject').TRAIN_FILE;
      pyProc = spawn('python',[script, mbox_path,save_path]);
      
//      pyProc.stdout.on('data', function(data) {
//          dataString += data.toString();
//      });
//      
//      pyProc.stdout.on('end', function() {
//          console.log('Emails are: \n' + dataString);
//      });
      
  }

  if (pyProc != null) {

      pyProc.stdout.on('data',function(data) {
          console.log(data.toString());
          // console.log(JSON.parse(JSON.stringify(data)));   
      })
      pyProc.stdout.on('end', function() {
          console.log('DONE');
      });
  } else {
      console.log('child process failed to run process')
  }
}

createPyProc()

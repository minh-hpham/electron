const electron = require('electron');
const path = require('path');
var fs = require('fs');

var APP_PATH = electron.remote.getGlobal('APP_PATH');

const PY_DIST_FOLDER = 'pycalcdist'
const PY_FOLDER = 'pycalc'
const PY_MODULE = 'readmail' // without .py suffix

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

/*
* create a child process to run pycalc/readmail.py to get the mbox file
* and preprocess it to make train.json file
*/
const createPyProc = () => {
  let script = getScriptPath()

  var dataString = ''
  if (!guessPackaged()) {
      var execFile = require("child_process").execFile;
      var mbox_path = electron.remote.getGlobal('sharedObject').MBOX_PATH;
      var save_path = electron.remote.getGlobal('sharedObject').TRAIN_FILE;

      pyProc = execFile('python',[script, mbox_path,save_path], (error,stdout,stderr) => {
         if (error) {
             console.error("Error when run file:",script,stderr);
             throw error;
         } else {
             console.log("Train file can be found at",save_path);
             var html_path = path.join(APP_PATH,"templates","email"+".html")
             location.assign(html_path);
         }
      });
  }
}

createPyProc()

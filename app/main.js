/*************************************************************
 * required variables
 *************************************************************/

const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const path = require('path')

const userDataPath = (electron.app || electron.remote.app).getPath('userData');


const ipc = electron.ipcMain


global.APP_PATH = __dirname


var fs = require('fs');

global.TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/reminiscent/';

global.sharedObject = {
    TOKEN_PATH : path.join(TOKEN_DIR, 'gmail-access-token.json'),
    CLIENT_PATH : path.join(__dirname,'assets','credentials', 'client_secret.json'),
    APP_INFO_PATH : TOKEN_DIR + 'appinfo.json',
    TRAIN_FILE : TOKEN_DIR + 'train.json',
    USER_PREFERENCE_FILE : TOKEN_DIR + 'user_verify.json',
    MBOX_PATH : null
}


/*************************************************************
 * window management
 *************************************************************/

let mainWindow = null

const createWindow = () => {
    mainWindow = new BrowserWindow({
        show : false,
        center : true,
        width: 1024,
        height: 600,
        icon : path.join(__dirname, 'assets','icons','png','64x64.png')
    })
    var html_file = ""
    if (fs.existsSync(global.sharedObject.TOKEN_PATH)) {
        if (fs.existsSync(global.sharedObject.APP_INFO_PATH) && fs.existsSync(global.sharedObject.TRAIN_FILE)) {
            if (fs.existsSync(global.sharedObject.USER_PREFERENCE_FILE)) {
                // update train.json with the current user's preference
                var execFile = require("child_process").execFile;
                var USER_PREFERENCE_FILE = global.sharedObject.USER_PREFERENCE_FILE;
                var TRAIN_FILE = global.sharedObject.TRAIN_FILE;
                var script = path.join(APP_PATH, "pycalc", "loadmore" + '.py')
                var pyProc = execFile('python',[script, TRAIN_FILE, USER_PREFERENCE_FILE], (error,stdout,stderr) => {
                     if (error) {
                         console.error("Error when run file:",script,stderr);
                         throw error;
                     }
                  });
            }
            html_file = "email.html";
        } else {
            html_file = "download.html";
        }
    } else {
        html_file = "signin.html";
    }

    mainWindow.loadURL(require('url').format({
        pathname: path.join(__dirname, 'templates',html_file),
        protocol: 'file:',
        slashes: true
    }))

    mainWindow.webContents.openDevTools()

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    })
//    mainWindow.on('close', (event) => {
//        event.preventDefault();
//        event.sender.send('user-close-window');
//
//    })
    mainWindow.on('closed',function () {
        mainWindow = null
    })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipc.on('ready-to-close-window', function (arg) {
    console.log("end")
})
/*************************************************************
 * helper functions to modify files
 *************************************************************/


/*************************************************************
 * py process
 *************************************************************/

const PY_DIST_FOLDER = 'pycalcdist'
const PY_FOLDER = 'pycalc'
const PY_MODULE = 'mailbox_api' // without .py suffix

let pyProc = null
let pyPort = null

const guessPackaged = () => {
  const fullPath = path.join(__dirname, PY_DIST_FOLDER)
  return fs.existsSync(fullPath)
}

const getScriptPath = () => {
  if (!guessPackaged()) {
    return path.join(__dirname, PY_FOLDER, PY_MODULE + '.py')
  }
  if (process.platform === 'win32') {
    return path.join(__dirname, PY_DIST_FOLDER, PY_MODULE, PY_MODULE + '.exe')
  }
  return path.join(__dirname, PY_DIST_FOLDER, PY_MODULE, PY_MODULE)
}

const selectPort = () => {
  pyPort = 4242
  return pyPort
}

const createPyProc = () => {
  let script = getScriptPath()
  let port = '' + selectPort()

  if (guessPackaged()) {
    pyProc = require('child_process').execFile(script, [port])
  } else {
    pyProc = require('child_process').spawn('python', [script, port])
  }
 
  if (pyProc != null) {
    //console.log(pyProc)
    console.log('child process success on port ' + port)
  }
}

const exitPyProc = () => {
  pyProc.kill()
  pyProc = null
  pyPort = null
}

//app.on('ready', createPyProc)
//app.on('will-quit', exitPyProc)

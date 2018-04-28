/*************************************************************
 * required variables
 *************************************************************/

const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const path = require('path')

global.APP_PATH = __dirname


var fs = require('fs');

TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.reminiscent/';

global.sharedObject = {
    TOKEN_PATH : TOKEN_DIR + 'gmail-access-token.json',
    APP_INFO_PATH : TOKEN_DIR + 'appinfo.json',
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

  var html_file = (fs.existsSync(global.sharedObject.APP_INFO_PATH)) ? "email.html" : "index.html";
  
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
  mainWindow.on('closed', () => {
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
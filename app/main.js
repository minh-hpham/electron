/*************************************************************
 * required variables
 *************************************************************/

const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const path = require('path')

const userDataPath = (electron.app || electron.remote.app).getPath('userData');


const ipc = electron.ipcMain
// global = can be shared across js files. but only declare in main.js

global.APP_PATH = __dirname


var fs = require('fs');

global.TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/reminiscent/';

global.sharedObject = {
    TOKEN_PATH : path.join(TOKEN_DIR, 'gmail-access-token.json'),
    CLIENT_PATH : path.join(__dirname,'assets','credentials', 'client_secret.json'),
    APP_INFO_PATH : TOKEN_DIR + 'appinfo.json',
    TRAIN_FILE : TOKEN_DIR + 'train.json',
    USER_PREFERENCE_FILE : TOKEN_DIR + 'user_preference.json',
    MBOX_PATH : null
}


/*************************************************************
 * window management
 *************************************************************/

let mainWindow = null
var user_can_close_window = false

const createWindow = () => {
    mainWindow = new BrowserWindow({
        show : false,
        center : true,
        width: 1024,
        height: 600,
        icon : path.join(__dirname, 'assets','icons','png','64x64.png')
    })
    // Choose which html file to run when user opens the app
    var html_file = ""
    // if user authorized the app
    if (fs.existsSync(global.sharedObject.TOKEN_PATH)) {
        // If user downloaded mbox and then had train.json
        if (fs.existsSync(global.sharedObject.APP_INFO_PATH) && fs.existsSync(global.sharedObject.TRAIN_FILE)) {
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
    // open the developer window along side the main window
    mainWindow.webContents.openDevTools()

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    })
    
    // event happends after user chooses to close main window
    mainWindow.on('close', (event) => {
        // user can only close when user's preference has been saved
        // and train.json is updated
        if (user_can_close_window == false) {
            event.preventDefault();
            mainWindow.hide();
            event.sender.send('user-close-window');
        }

    })
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


// Now the user's preference is saved. Update train.json with new emails
// by creating a child process to call pycalc/loadmore.py
ipc.on('ready-to-close-window', function (arg) {
    console.log(arg)
    if (fs.existsSync(global.sharedObject.USER_PREFERENCE_FILE)) {
        // update train.json with the current user's preference
        var execFile = require("child_process").execFile;
        // arguments
        var script = path.join(APP_PATH, "pycalc", "loadmore" + '.py')
        var pyProc = execFile('python',[script], (error,stdout,stderr) => {
             if (error) {
                 console.error("Error when run file:",script,stderr);
                 throw error;
                 user_can_close_window = true
                 mainWindow.close()
             } else {
                 console.log("Requested new emails and updated training file");
                 user_can_close_window = true
                 mainWindow.close()
             }
          });
    }
})

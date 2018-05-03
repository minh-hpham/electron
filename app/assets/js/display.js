const electron = require('electron');
const remote = electron.remote;
const path = require('path')
const ipc = electron.ipcRenderer

const $ = require('jQuery');
const TRAIN_FILE = remote.getGlobal('sharedObject').TRAIN_FILE;


var fs = require('fs');

var likelist = []
var dislikelist = []
var count_inbox = 0;

// Update the train.json file by removing disliked emails. Update the user's preference by
// adding senders and subject's keywords to user_preference.json
// How: Create a child process to run pycalc/modifyemail.py. Arguments: like and dislike lists
const update_train_file = () => {
    var execFile = require("child_process").execFile;
    var APP_PATH = remote.getGlobal('APP_PATH');
    var USER_PREFERENCE_FILE = remote.getGlobal('sharedObject').USER_PREFERENCE_FILE;
    var script = path.join(APP_PATH, "pycalc", "modifymail" + '.py')

    var pyProc = execFile('python',[script, JSON.stringify(likelist), JSON.stringify(dislikelist)], (error,stdout,stderr) => {
         if (error) {
             console.error("Error when run file:",script,stderr);
             // notify the main process that the child process is failed
             // and this window is ready to be closed
             ipc.send('ready-to-close-window',stderr);
             throw error;
         } else {
             // signal the main process that the child process is succeeded
             // and this window is ready to be closed
             ipc.send('ready-to-close-window',"SUCCEED");
         }

      });
}
// call function to update train.json when user wants to close the window
ipc.on('user-close-window', update_train_file);

/*
* Display the emails from train.json or request user to download mbox so 
* the app can create the train.json
*/
function view() {
    fs.readFile(TRAIN_FILE, (err,data) => {
        if (err) {
            remote.dialog.dialog.showMessageBox(remote.getCurrentWindow(), {
                type: "error",
                buttons: "Back to Start",
                title: "Error",
                message: "Oops! Look like the training process is not complete. Please go back to the training."
            }, function(resp) {
                if (resp == 0) {
                    location.assign('../../templates/download.html');
                }
            } )
        } else {
            var messages = JSON.parse(data);
            display_messages(messages);
        }

    })
}
/*
* add html elements to the email.html file
*/
function display_messages(messages) {
    count_inbox = Object.keys(messages).length;
    $('#myBtn').text("Inbox (" + count_inbox + ")");

    for (var message_id in messages) {
        var message = messages[message_id];
        var subject = message.subject;
        var sender = message.from+ ' ' + message.date;
        // add elements to the navigation on the left
        $("#onSideBar").append(
            '<a style="text-decoration: none;color: black;" href="javascript:void(0)" class="w3-bar-item w3-button w3-border-bottom test w3-hover-light-grey" onclick="openMail(\''+message_id+ '\');w3_close();" id="'+"nav-"+message_id+'">'
            + '<div class="w3-container">'
            +    '<h6>'+subject+'</h6>'
            +   '<span class="w3-opacity w3-large">'+message.from+'</span>'
//            +    '<p>'+message.snippet+'</p>'
            +  '</div>'
            +'</a>');
        // add email componets on the right
        $(".w3-main").append(
            '<div id="'+message_id+'" class="w3-container person">'
            + '<br>'
            +'<h5 class="w3-opacity">Subject: '+subject+'</h5>'
            +  '<h4><i class="fa fa-clock-o"></i> From '+sender+'</h4>'
            +  '<a class="w3-button w3-light-grey" onclick="likeMail(\''+message_id+ '\');"> Like <i class="w3-margin-left fa "></i></a>'
            + '<a class="w3-button w3-light-grey" onclick="UnLikeMail(\''+message_id+ '\');"> Unlike <i class="w3-margin-left fa "></i></a>'
            + '<hr>'
            +  message.body["text/html"]
            +'</div>')

    }
    // open the first email
    var openInbox = document.getElementById("myBtn");
    openInbox.click();
    openMail(Object.keys(messages)[0]);
    var openTab = document.getElementById("nav-"+Object.keys(messages)[0]);
    openTab.click();
}

/*
* Called when the UnLike button is clicked. 
* Remove unliked email from the UI and add unliked email's id to the dislike list
*/
function UnLikeMail(message_id) {
    count_inbox = count_inbox - 1;
    $('#myBtn').text("Inbox (" + count_inbox + ")");
    $( "#nav-"+message_id ).remove();
    $( "#"+message_id ).remove();
    dislikelist.push(message_id);
}

/*
* Called when the Like button is clicked. 
* Remove unliked email from the UI and add unliked email's id to the dislike list
*/
function likeMail(message_id) {
    var a1 = document.getElementById(message_id).getElementsByTagName('a')[0]
    // If the email is already liked, it can't be liked again
    if (a1.classList.contains("w3-red") == false) {
        likelist.push(message_id);
        // set the button's color from light grey to red
        a1.className = a1.className.replace(" w3-light-grey"," w3-red");
        document.getElementById(message_id).getElementsByTagName('a')[1].remove();
    }
}

/*
* open the side navigation on small screens
*/
function w3_open() {
    document.getElementById("mySidebar").style.display = "block";
    document.getElementById("myOverlay").style.display = "block";
}
/*
* close the side navigation on small screens
*/
function w3_close() {
    document.getElementById("mySidebar").style.display = "none";
    document.getElementById("myOverlay").style.display = "none";
}

/*
* display and not-display the list of email if click on inbox
*/
function myFunc(id) {
    var x = document.getElementById(id);
    if (x.className.indexOf("w3-show") == -1) {
        x.className += " w3-show";
        x.previousElementSibling.className += " w3-red";
    } else {
        x.className = x.className.replace(" w3-show", "");
        x.previousElementSibling.className =
        x.previousElementSibling.className.replace(" w3-red", "");
    }
}

/*
* Show the email's content on the right when click on corresponding snippet on the left
*/
function openMail(id) {
    var i;
    var x = document.getElementsByClassName("person");
    for (i = 0; i < x.length; i++) {
       x[i].style.display = "none";
    }
    x = document.getElementsByClassName("test");
    for (i = 0; i < x.length; i++) {
       x[i].className = x[i].className.replace(" w3-light-grey", "");
    }
    document.getElementById(id).style.display = "block";
    $('#'+id).className += " w3-light-grey";
}

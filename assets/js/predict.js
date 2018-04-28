var $ = require('jQuery');

var fs = require('fs');
var path = require('path');

var google = require('googleapis');

var base64url = require('base64url');
//var googleAuth = require('google-auth-library');

var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';

var MESSAGE_DIR = TOKEN_DIR + 'messages/';
var MESSAGE_PATH = MESSAGE_DIR + 'messages.json';



function view() {
    fs.readFile(MESSAGE_PATH, function(err, data) {
        if (err) {
            load_client_sercret(searchSubject);
        } else {
            var messages = JSON.parse(data);
            display_messages(messages);
        }

    });
}

function display_messages(messages) {
    $('#myBtn').text("Inbox (" + Object.keys(messages).length + ")");

    for (var message_id in messages) {
        var message = messages[message_id];
//        var name = message.from.match(/\w+\,\s\w+/)[0] || message.from.match(/<(.*?)>/)[1] ;
//        if (name != null) {
//            name = name[0] + " " + message.date
//        } else {
//            name = "None";
//        }
//        var email = message.from.match(/<(.*?)>/);


        var subject = message.subject;
        var sender = message.from+ ' ' + message.date;
        $("#onSideBar").append(
            '<a href="javascript:void(0)" class="w3-bar-item w3-button w3-border-bottom test w3-hover-light-grey" onclick="openMail(\''+message_id+ '\');w3_close();" id="'+"nav-"+message_id+'">'
            + '<div class="w3-container">'
            +   '<span class="w3-opacity w3-large">'+message.from+'</span>'
            +    '<h6>Subject: '+subject+'</h6>'
            +    '<p>'+message.snippet+'</p>'
            +  '</div>'
            +'</a>')

        $(".w3-main").append(
            '<div id="'+message_id+'" class="w3-container person">'
            + '<br>'
            +'<h5 class="w3-opacity">Subject: '+subject+'</h5>'
            +  '<h4><i class="fa fa-clock-o"></i> From '+sender+'</h4>'
            +  '<a class="w3-button w3-light-grey" href="#"> Like <i class="w3-margin-left fa "></i></a>'
            + '<a class="w3-button w3-light-grey" href="#"> Unlike <i class="w3-margin-left fa "></i></a>'
            + '<hr>'
            +  '<p>'+message.body+'</p>'
//            +  '<p>'+base64url.decode(message.body)+'</p>'
            +'</div>')

    }

    var openInbox = document.getElementById("myBtn");
    openInbox.click();
    openMail(Object.keys(messages)[0]);
    var openTab = document.getElementById("nav-"+Object.keys(messages)[0]);
    openTab.click();
}
/**
* Load client secrets from a local file.
*/
function load_client_sercret(callback) {
    var jsonPath = path.join(__dirname, 'assets', 'credentials','client_secret.json');
    fs.readFile(jsonPath, function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        } else {
            authorize(JSON.parse(content), callback);
        }
    });
}
/**
* Authorize a client with the loaded credentials, then call the Gmail API.
*/
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
//  var auth = new googleAuth();
  var oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
        console.log("API error: " + err);
        return;
    } else {
        oauth2Client.credentials = JSON.parse(token);
        callback(oauth2Client);
    }
  });
}

function searchSubject(auth) {
    var gmail = google.gmail({
        version: 'v1',
        auth : auth
    });
    gmail.users.messages.list({
        userId: 'me',
        maxResults: 10,
        q: "{subject:party subject:dinner}",
    }, function(err,response) {
        if (err) {
            console.log('The API returned an error: ' + err);
          return;
        } else {
            var messages = response.data.messages;
            if (messages.length == 0) {
              console.log('No messages found.');
            } else {
                storeMessages(gmail,messages);
            }
        }

    })
}

function storeMessages(gmail,messages) {
    try {
        fs.mkdirSync(MESSAGE_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
          throw err;
        }
    }
    save_message_wrapper(gmail,messages,
        function(){
            fs.readFile(MESSAGE_PATH, function(error,data) {
                if (error) {
                   console.log("Error open message file after saved: " + error)
                } else {
                   var msg = JSON.parse(data);
                   display_messages(msg);
                }
            });
        }
    );

}

function save_message_wrapper(gmail,messages,callback) {
    var count = 0;
    function report() {
        count++;
        if(count === messages.length) {
            callback();
        }
    }
    var get_and_save_message = function(index) {
        if (index == messages.length) {
            callback();
        } else {
            var message_id = messages[index].id;
            gmail.users.messages.get({
                id: message_id,
                userId: 'me',
                format: 'full',
            }, function(err,response) {
                if (err) {
                    console.log('The API returned an error: ' + err);
                    return;
                } else {
                    response = response.data;
                    var result = only_needed_data(response);

                    fs.readFile(MESSAGE_PATH, function readFileCallback(err, data){
                        var obj;
                        if (err){
                            obj = {};
                        } else {
                            obj = JSON.parse(data); //now it an object
                        }
                        obj[response.id] = result;
                        fs.writeFile(MESSAGE_PATH, JSON.stringify(obj),function (err) {
                          if (err) throw err;
                        });
                    });
                    get_and_save_message(index+1);
                }
            });
        }
    };
    get_and_save_message(0);
}

function only_needed_data(response) {
    var headers = response.payload.headers;
    var from; var to; var subject; var date;
    for (var j = 0; j < headers.length; j++) {
        if(headers[j].name == 'From') {
            from = headers[j].value;
        } else if(headers[j].name == 'Delivered-To') {
            to = headers[j].value;
        } else if(headers[j].name == 'Subject') {
            subject = headers[j].value;
        } else if(headers[j].name == 'Date') {
            date = headers[j].value;
        }
    }
    var search_body = response.payload;
    while(search_body.mimeType != 'text/plain') {
        search_body = search_body.parts[0];
    }
    var body = base64url.decode(search_body.body.data);
    var result = {
        labelIds : response.labelIds,
        snippet : response.snippet,
        subject : subject,
        from : from,
        to : to,
        date : date,
        body : body
    };
    return result;
}


function listLabels(auth) {
    var gmail = google.gmail('v1');
    gmail.users.labels.list({
        auth: auth,
        userId: 'me',
    }, function(err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          return;
        } else {
            var labels = response.labels;
            if (labels.length == 0) {
              console.log('No labels found.');
            } else {
              console.log('Labels:');
              for (var i = 0; i < labels.length; i++) {
                var label = labels[i];
                console.log('- %s', label.name);
              }
            }

        }

    });
}

function w3_open() {
    document.getElementById("mySidebar").style.display = "block";
    document.getElementById("myOverlay").style.display = "block";
}
function w3_close() {
    document.getElementById("mySidebar").style.display = "none";
    document.getElementById("myOverlay").style.display = "none";
}

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

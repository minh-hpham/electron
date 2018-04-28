var $ = require('jQuery');

var fs = require('fs');
var path = require('path');

var google = require('googleapis');
//var googleAuth = require('google-auth-library');

var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';


/**
* Open external link
*/

$("#authUrl").on('click',function(event) {
    event.preventDefault();
    shell.openExternal(this.href);
    $('.message').hide();
    $('#user-code').show();
});



// start when User clicks on Sign In with Google Account
function signin() {
    var jsonPath = path.join(__dirname, 'assets', 'credentials','client_secret.json');
    fs.readFile(jsonPath, function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        // Authorize a client with the loaded credentials, then call the
        // Gmail API.
        authorize(JSON.parse(content),changeView);
    });
}

/**
* Go to the main page
*/
function changeView() {
    var htmlPath = path.join(__dirname, 'email.html');
    location.assign(htmlPath);
}

/**
* Create an OAuth2 client with the given credentials, and then execute the given callback function.
*/
function authorize(credentials,callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
//  var auth = new googleAuth();
  var oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
        getNewToken(oauth2Client,callback);
    } else {
        callback();
    }

  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 */
function getNewToken(oauth2Client,callback) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });

    $('#signin-btn').attr('style', 'display: none');
//    $("#authUrl").text(authUrl);
    $("#authUrl").attr("href", authUrl);
    $('.message').show();

    $("#user-code").on("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode === 13) {
            var code = $("#user-code").val();
            oauth2Client.getToken(code, function(err, token) {
              if (err) {
                alert('Error while trying to retrieve access token', err);
                return;
              }
              storeToken(token);
              callback();
            });
        }
    })
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token),function (err) {
                  if (err) throw err;
                }
              );
  console.log('Token stored to ' + TOKEN_PATH);
}



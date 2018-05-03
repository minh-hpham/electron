


"""Get a list of Messages from the user's mailbox.
"""
from apiclient import errors
from apiclient.discovery import build
from httplib2 import Http
from oauth2client import file, client, tools

import base64
import email
import os, sys, json, datetime

"""To receive additional arguments from the system. E.g: open url for authorization"""
try:
    import argparse
    flags = argparse.ArgumentParser(parents=[tools.argparser]).parse_args()
except ImportError:
    flags = None

"""Recursively search for candidate of email conten"""
def _search_message_bodies(bodies,part):
    mimeType = part["mimeType"]
    if mimeType.startswith('multipart/'):
        part = part["parts"]
        if mimeType == 'multipart/related': # embedded image
            # just search the metadata, which is the first part of this part
            _search_message_bodies(bodies, part[0])
            return
        elif mimeType == 'multipart/alternative':
            # all parts are candidates and the latest is the best
            for subpart in part:
                _search_message_bodies(bodies, subpart)
        elif mimeType in ('multipart/report',  'multipart/signed'):
            try:
                subpart = part[0]
            except IndexError:
                return
            else:
                _search_message_bodies(bodies, subpart)
                return
        elif mimeType == 'multipart/signed':
            # cannot handle this
            return
        else:
            # unknown types are handled as 'multipart/mixed'
            for subpart in part:
                tmp_bodies = dict()
                _search_message_bodies(tmp_bodies, subpart)
                for k,v in tmp_bodies.items():
                    # if not an attachment, initiate value if not already found
                    if not ("attachmentId" in subpart["body"]):
                        bodies.setdefault(k, v)
            return
    else:
        # find charset
        if part["filename"]:
            return
        charset = None
        content_type = None
        for header in part['headers']:
            if header['name'] == "Content-Type":
                content_type = header['value'].split(";",1)[0]
                if "charset=" in header['value']:
                    charset = header['value'].split("charset=",1)[1]
                    
        """Need to improve: sometimes still fails to decode this body -> this body can't be deode !?"""
        if charset is None:
            try:
                bodies[content_type] = base64.urlsafe_b64decode(part['body']['data']).decode()
            except Exception as e:
                print(e)
        else:
            try:
                bodies[content_type] = base64.urlsafe_b64decode(part['body']['data'].encode(charset)).decode(charset)
            except Exception as e:
                print(e)
        return

"""Wrapper function for recursive message body searching"""
def search_message_bodies(mail):
    bodies = dict()
    _search_message_bodies(bodies,mail['payload'])
    return bodies


def GetMessage(service, msg_id, user_id='me'):
    """Get a Message with given ID.

    Args:
    service: Authorized Gmail API service instance.
    user_id: User's email address. The special value "me"
    can be used to indicate the authenticated user.
    msg_id: The ID of the Message required.

    Returns:
    A Message.
    """
    try:
        message = service.users().messages().get(userId=user_id, id=msg_id).execute()

        return message
    except errors.HttpError as error:
        print('An error occurred: %s' % error)

"""Get the user's authorization"""
def get_service():
    SCOPES = 'https://www.googleapis.com/auth/gmail.readonly'


    home_dir = os.path.expanduser('~')
    credential_dir = os.path.join(home_dir,'reminiscent','credentials')

    if not os.path.exists(credential_dir):
        os.makedirs(credential_dir)
    credential_path = os.path.join(credential_dir,
                                             'credentials.json')
    dir_path = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    CLIENT_SECRET_FILE = os.path.join(dir_path, "assets", 'credentials','client_secret.json')

    store = file.Storage(credential_path)
    credentials = store.get()
    if not credentials or credentials.invalid:
        flow = client.flow_from_clientsecrets(CLIENT_SECRET_FILE, SCOPES)
#        flow.redirect_uri = 'http://localhost:5580'
        credentials = tools.run_flow(flow, store)
    service = build('gmail', 'v1', http=credentials.authorize(Http()))
    return service


def ListMessagesMatchingQuery(service, user_id, query=''):
    """List all Messages of the user's mailbox matching the query.

    Args:
    service: Authorized Gmail API service instance.
    user_id: User's email address. The special value "me"
    can be used to indicate the authenticated user.
    query: String used to filter messages returned.
    Eg.- 'from:user@some_domain.com' for Messages from a particular sender.

    Returns:
    List of Messages that match the criteria of the query. Note that the
    returned list contains Message IDs, you must use get with the
    appropriate ID to get the details of a Message.
    """
    try:
        response = service.users().messages().list(userId=user_id,
                                                   maxResults=10,
                                                   q=query).execute()
        messages = []
        if 'messages' in response:
            messages.extend(response['messages'])

        while 'nextPageToken' in response:
            page_token = response['nextPageToken']
            response = service.users().messages().list(userId=user_id, q=query,
                                             pageToken=page_token).execute()
            messages.extend(response['messages'])

        return messages
    except errors.HttpError as error:
        print('An error occurred: %s' % error)

"""Get new emails based on the user's preference"""
def get_new_mail(file):
    service = get_service()
    data = json.load(open(file))
    # generate query
    # e.g {subject:Yuki from:Nick} after:2016/04/15 -{subject:Na subject:party}
    date = data.get("last_query") # if date is None, do sth
    liked_senders = ' '.join(data.get("like",{}).get("senders",[]))
    liked_subjects = ' '.join(data.get("like",{}).get("subjects",[]))
    disliked_senders = ' '.join(data.get("dislike",{}).get("senders",[]))
    disliked_subjects = ' '.join(data.get("dislike",{}).get("subjects",[]))

    # update last query for the user's preference file
    data["last_query"] = datetime.datetime.today().strftime('%Y/%m/%d')
    with open(file, 'w') as outfile:
        json.dump(data, outfile)

    """
    To learn more about query: https://support.google.com/mail/answer/7190?hl=en
    """
    query = 'after:%s {from:{%s} subject:{%s}} -{from:{%s} subject:{%s}}' % (date, liked_senders, liked_subjects,disliked_senders,disliked_subjects)

    # get list of messages with query
    messages = ListMessagesMatchingQuery(service,'me',query)
    # get each message
    mails = {}

    for response in messages:
        message_id = response["id"]
        message = GetMessage(service,message_id)
        headers = message["payload"]["headers"]

        _subject = ""
        _from = ""
        _to = ""
        _date = ""

        for part in headers:
            if part["name"] == "From":
                _from = part["value"]
            elif part["name"] == "Delivered-To":
                _to = part["value"]
            elif part["name"] == "Subject":
                _subject = part["value"]
            elif part["name"] == "Date":
                _date = part["value"]

        _body = search_message_bodies(message)

        mails[message_id] = {
            "subject" : _subject,
            "from" : _from,
            "to" : _to,
            "date" : _date,
            "body" : _body
        }

    return mails

def main():
    try:
        home_dir = os.path.expanduser('~')
        app_dir = os.path.join(home_dir,'reminiscent')
        train_path = os.path.join(app_dir,
                                             'train.json')
        preference_path = os.path.join(app_dir,
                                             'user_preference.json')
        newmail = get_new_mail(preference_path) # user preference
        data = json.load(open(train_path))
        data.update(newmail)

        with open(train_path, 'w') as outfile:
            json.dump(data, outfile)
    except Exception as e:
        print(e)

if __name__ == '__main__':
    main()

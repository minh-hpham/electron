
import sys, json

"""Get a list of Messages from the user's mailbox.
"""

from apiclient import errors
from __future__ import print_function
from apiclient.discovery import build
from httplib2 import Http
from oauth2client import file, client, tools

import base64
import email
from apiclient import errors

def GetMessage(service, user_id, msg_id):
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

        print 'Message snippet: %s' % message['snippet']

        return message
    except errors.HttpError, error:
        print 'An error occurred: %s' % error


def GetMimeMessage(service, user_id, msg_id):
    """Get a Message and use it to create a MIME Message.

    Args:
    service: Authorized Gmail API service instance.
    user_id: User's email address. The special value "me"
    can be used to indicate the authenticated user.
    msg_id: The ID of the Message required.

    Returns:
    A MIME Message, consisting of data from Message.
    """
    try:
        message = service.users().messages().get(userId=user_id, id=msg_id,
                                                 format='raw').execute()

        print 'Message snippet: %s' % message['snippet']

        msg_str = base64.urlsafe_b64decode(message['raw'].encode('ASCII'))

        mime_msg = email.message_from_string(msg_str)

        return mime_msg
    except errors.HttpError, error:
        print 'An error occurred: %s' % error


def get_service():
    # Setup the Gmail API
    SCOPES = 'https://www.googleapis.com/auth/gmail.readonly'
    store = file.Storage('credentials.json')
    creds = store.get()
    if not creds or creds.invalid:
        flow = client.flow_from_clientsecrets('../assets/credentials/client_secret.json', SCOPES)
        creds = tools.run_flow(flow, store)
    service = build('gmail', 'v1', http=creds.authorize(Http()))
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
    except errors.HttpError, error:
        print 'An error occurred: %s' % error


def get_new_mail(file):
    service = get_service()
    data = json.load(open(file))

    # generate query
    # e.g {subject:Yuki from:Trang} after:2016/04/15 -{subject:Na subject:MSF}
    date = data.get("last_query") # if date is None, do sth
    liked_senders = ''.join(data.get("like",{}).get("senders",[]))
    liked_subjects = ''.join(data.get("like",{}).get("subjects",[]))
    disliked_senders = ''.join(data.get("dislike",{}).get("senders",[]))
    disliked_subjects = ''.join(data.get("dislike",{}).get("subjects",[]))

    query = 'after:%s {from:{%s} subject:{%s}} -{from:{%s} subject:{%s}}'
    % (date, liked_senders, liked_subjects,disliked_senders,disliked_subjects)

    # get list of messages with query
    messages = ListMessagesMatchingQuery(service,'me',query)
    # get each message


def main():
    newmail = get_new_mail(sys.argv[2]) # user preference

    train_file = sys.argv[1] # train.json
    data = json.load(open(train_file))
    data.update(newmail)

    with open(train_file, 'w') as outfile:
        json.dump(data, outfile)

if __name__ == '__main__':
    main()

import sys, json, mailbox
from email.header import decode_header
from parsemail import search_message_bodies as get_message
'''
PLAN:
2-round reading emails

- 1st round: using Misra-Gries(A) with optional argument, list of commercial/ educational/ instutuitonal senders such as BestBuy or .edu, to find the majority 10 senders. Try to exclude email matching optional argument
- 2nd round: extract email from the majority senders 
'''

'''k is the number of senders you want to extract'''
def misra_gries(file, k=10, unwanted_list=[]):
    senders = [None] * k
    count_senders = [0] * k
    for email in file:
        sender = decode_email(email['from'])
        subject = decode_email(email['subject'])
        if is_unwanted_sender(sender,subject,unwanted_list):
            continue
        try:
            i = senders.index(sender)
        except ValueError:
            i = -1
        if i != -1:
            count_senders[i] = count_senders[i] + 1
        else:
            try:
                i = count_senders.index(0)
            except ValueError:
                i = -1
            if i != -1:
                senders[i] = sender
                count_senders[i] = 1
            else:
                count_senders[:] = [x - 1 for x in count_senders]
    return senders
    
# return true if the sender or the subject is in the unwanted list
def is_unwanted_sender(sender_address,subject,unwanted_list):
    for e in unwanted_list:
        e = e.lower()
        if (e in sender_address.lower()) or (e in subject.lower()):
            return True
    return False


# utf-8 decode string from mbox file 
def decode_email(string):
    out,encoding = decode_header(string)[0]
    if out:
        if encoding is not None:
            out = out.decode('utf-8','ignore')
    else:
        out = 'UNKNOWN'
    return out

    
def get_string_message(message):
    body = None
    if message.is_multipart():
        for part in message.walk():
            if part.is_multipart():
                for subpart in part.walk():
                    if subpart.get_content_type() == 'text/plain':
                        body = subpart.get_payload(decode=True)
            elif part.get_content_type() == 'text/plain':
                body = part.get_payload()
    elif message.get_content_type() == 'text/plain':
        body = message.get_payload(decode=True)

    return body
#decode_email(str(body))
#    if message.is_multipart():
#        content = ''.join(part.get_payload(decode=True) for part in message.get_payload())
#    else:
#        content = message.get_payload(decode=True)
#    return content


def get_email_from_sender(file, senders):
    data = {}
    for email in file:
        sender = decode_email(email['from'])
        if sender in senders:
            labelIds = email['X-GM-THRID']
            subject = decode_email(email['subject'])
            
            body = get_message(email)
#            if "text/plain" in body:
#                snippet = body["text/plain"][:200]
#            else:
#                snippet = ""
            data[labelIds] = {
                "subject" : subject,
                "from" : sender,
                "to" : email['Delivered-To'],
                "date" : email['Date'],
#                "snippet" : snippet,
                "body": body
            }
    return data


def main():
    try:
        mymail = mailbox.mbox(sys.argv[1])        
        # 1st round
        unwantedlist = ["mongodb","amazon","BestBuy","ebay","netflix","facebook","tencent","alibaba","expedia","baidu","order of","return of","no-reply","noreply","mailing list","mailing_list","license","customer service","request","account","Thanks for your interest in","Thanks for applying","Thanks for submitting","Application has been submitted","Please confirm your","receipt","please read"]
        senders = misra_gries(mymail,10,unwantedlist)
        # 2nd round
        data = get_email_from_sender(mymail, senders)
        # write to json file
        filename = sys.argv[2]
        with open(filename, 'w') as outfile:
            json.dump(data, outfile)
        
    except Exception as e:
        print(e)
        


if __name__ == '__main__':
    main()



from collections import Counter
from textblob import TextBlob

import mailbox
import re
import sys  


#reload(sys)  
#sys.setdefaultencoding('ISO-8859-1')
#input_file = sys.argv[1]
# feature_vector=[]

"""return an array of boolean that subject is Reply, Forward, Reminder, 
Invite or Alert"""
def get_subject_info(subject):
    sub_len = len(subject)
    if (sub_len == 0):
        sub_wrd = 0
        sub_re = 0
        sub_fwd = 0
        sub_reminder = 0
        sub_invite = 0
        sub_alert = 0
    else:
        sub_wrd = len(subject.split())
        if "re:" or "RE:" in subject:
            sub_re = 1
        else:
            sub_re = 0
        if "fwd:" or "FWD:" in subject:
            sub_fwd = 1
        else:
            sub_fwd = 0
        if "reminder" or "REMINDER" in subject:
            sub_remindr = 1
        else:
            sub_reminder = 0
        if "INVITE" or "invite" in subject:
            sub_invite = 1
        else:
            sub_invite = 0
        if "alert" or "ALERT" in subject:
            sub_alert = 1
        else:
            sub_alert = 0
    return  sub_len,sub_wrd,sub_re,sub_fwd,sub_reminder,sub_invite,sub_alert

"""getting plain text 'email body'"""
def getbody_final(message): 
    body = None

    if message.is_multipart():
        for part in message.walk():
            if part.is_multipart():
                for subpart in part.walk():
                    if subpart.get_content_type() == 'text/plain':
                        body = subpart.get_payload(decode=True)
            elif part.get_content_type() == 'text/plain':
                body = part.get_payload(decode=True)
    elif message.get_content_type() == 'text/plain':
        body = message.get_payload(decode=True).decode('utf-8')

    if (body is None) :
        return "Couldn't parse body message"
    return body


"""getting plain text 'email body'"""
def getbody(message): 
    body = None
    polarity_=None
    body_list=[]
    if message.is_multipart():
        for part in message.walk():
            if part.is_multipart():
                for subpart in part.walk():
                    if subpart.get_content_type() == 'text/plain':
                        body = subpart.get_payload(decode=True)

            elif part.get_content_type() == 'text/plain':
                body = part.get_payload(decode=True)
    elif message.get_content_type() == 'text/plain':
        body = message.get_payload(None,decode=True)   
        text = TextBlob(body.decode('utf-8'))
        polarity_ = text.sentiment.polarity
    return body,polarity_

def get_final_message(thread_final_list,input_file):
    #final_msg =None
    mymail = mailbox.mbox(input_file)
    thread_num = thread_final_list[0][0]
    polarity = thread_final_list[0][-2]
    no_msg = thread_final_list[0][1]
    #print thread_num,polarity,no_msg
    for message in mymail:
        thread_id = message['X-GM-THRID']
        if (thread_id == thread_final_list[0][0]):
            print(getbody_final(message))
            #print final_msg

def message_content_proc(thread_list_new,input_file):
    for sublist in thread_list_new:
        if ((sublist[-2] < 0.10) or (sublist[-2]  == None)):
            thread_list_new.remove(sublist)
   # print "----final list----",len(thread_list_new)
    thread_list_new.sort(key=lambda x: x[-2], reverse=True)
    #get_final_message(thread_list_new,input_file)
    return thread_list_new        

def message_To_proc(thread_list_n,input_file):
    thread_list_n_=[]
    for sublist in thread_list_n:
        if (sublist[2] == sublist[3]):
            thread_list_n.remove(sublist)
    thread_list_n_ = message_content_proc(thread_list_n,input_file)
    return thread_list_n

def message_content_len_proc(thread_list_,input_file):
    for sublist in thread_list_:
        if (sublist[-1] < 30):
            thread_list_.remove(sublist)
    thread_n_list_= message_To_proc(thread_list_,input_file)		
    return thread_n_list_

def message_from_thread_proc(list_thread,list_from,input_file):
    list_after_proc=[]
    new_thread_list=[]
    list_from = dict(list_from)
    for key in list_from:
    	from_val = list_from[key]
    	if (from_val < 4):
    		if key in [sublist[3] for sublist in list_thread]:
    			list_thread.remove(sublist)
    list_after_proc = message_content_len_proc(list_thread,input_file)
    return list_after_proc   

def from_list_count(from_list_):
    count_from=[]
    count_from=Counter(from_list_)
    count_from=count_from.most_common()
    return count_from    

def thread_count_info(list_A):
    d={}
    list_A.sort(key=lambda x:x[0])
    d=Counter(sublist[0] for sublist in list_A)
    #print "--------------sorted list with count of messages per thread----------------------\n"
    d=d.items()
    d.sort(key=lambda x:x[0])
    temp_d_=list(d)
    j=0;
    for i in range(len(list_A)):
        if(list_A[i][0] == temp_d_[j][0]):
            count = temp_d_[j][1]
            if (count == 1):
                list_A[i].insert(1,d[j][1])
                temp_d_[j]=list(temp_d_[j])
                temp_d_[j][1]=0;    
                j+=1
            else:
                list_A[i].insert(1,d[j][1])
                temp_d_[j]=list(temp_d_[j])
                temp_d_[j][1]=temp_d_[j][1]-1           
    return list_A

def proc(input_file):
    list_A=[]
    list_count=[]
    from_list=[]
    To_list=[]
    body_proc_list =[]
    body_list=[]
    list_A_T_count=[]
    from_count=[]
    list_T_F=[]
    sublist_list=[]
    d={}
    mymail = mailbox.mbox(input_file)
    data = {}
    for message in mymail:
        thread_id = message['X-GM-THRID']
        To_ = message['To']
        To_list.append(To_)
        From_ = message['From']
        from_list.append(From_)
        Subject_ = message['Subject']
        sublist_list.append(Subject_)
        body_ = getbody_final(message)

        date_ = message['Date']
        data[thread_id] = {
            "To" : To_,
            "From" : From_,
            "Subject" : Subject_,
            "Date" : date_,
            "Snippet": body_[:200],
            "Body" : body_
        }
        print(data[thread_id])
        print("\n")
    return data



if __name__ == '__main__':
    # print(sys.argv[1])
    try:
        data = proc(sys.argv[1])
        # for i in data.subjects.data:
        #     print(i)
        if data is not None:
            print(JSON.stringify(data))
        else:
            print("data is none")
    except Exception as e:
        print(e)
    sys.stdout.flush()
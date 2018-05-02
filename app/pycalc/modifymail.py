
import os, sys, json

def main():
    try:
        stopwords = set(['a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', "aren't", 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', "can't", 'cannot', 'could', "couldn't", 'did', "didn't", 'do', 'does', "doesn't", 'doing', "don't", 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', "hadn't", 'has', "hasn't", 'have', "haven't", 'having', 'he', "he'd", "he'll", "he's", 'her', 'here', "here's", 'hers', 'herself', 'him', 'himself', 'his', 'how', "how's", 'i', "i'd", "i'll", "i'm", "i've", 'if', 'in', 'into', 'is', "isn't", 'it', "it's", 'its', 'itself', "let's", 'me', 'more', 'most', "mustn't", 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', "shan't", 'she', "she'd", "she'll", "she's", 'should', "shouldn't", 'so', 'some', 'such', 'than', 'that', "that's", 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', "there's", 'these', 'they', "they'd", "they'll", "they're", "they've", 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', "wasn't", 'we', "we'd", "we'll", "we're", "we've", 'were', "weren't", 'what', "what's", 'when', "when's", 'where', "where's", 'which', 'while', 'who', "who's", 'whom', 'why', "why's", 'with', "won't", 'would', "wouldn't", 'you', "you'd", "you'll", "you're", "you've", 'your', 'yours', 'yourself', 'yourselves'])

        home_dir = os.path.expanduser('~')
        app_dir = os.path.join(home_dir,'reminiscent')
        train_path = os.path.join(app_dir,'train.json')
        preference_path = os.path.join(app_dir,'user_preference.json')

        if not os.path.isfile(preference_path):
            preference = {}
            preference["last_query"] = ""
            preference["like"] = {}
            preference["dislike"] = {}

            preference["like"]["senders"] = []
            preference["like"]["subjects"] = []
            preference["dislike"]["senders"] = []
            preference["dislike"]["subjects"] = []
        else:
            preference = json.load(open(preference_path))

        liked_senders = set(preference["like"]["senders"])
        liked_subjects = set(preference["like"]["subjects"])

        disliked_senders = set(preference["dislike"]["senders"])
        disliked_subjects = set(preference["dislike"]["subjects"])


        likeid = json.loads(sys.argv[1])
        print(likeid)
        dislikeid = json.loads(sys.argv[2])
        print(dislikeid)
        train = json.load(open(train_path))

        for like in likeid:
            message = train.get(like,None)
            if message is None:
                continue
            liked_senders.add(message["from"])
            words = set(message["subject"].split())
            liked_subjects.update(words - stopwords)

        for dislike in dislikeid:
            message = train.pop(dislike,None)
            if message is None:
                continue
            disliked_senders.add(message["from"])
            words = set(message["subject"].split())
            disliked_subjects.update(words - stopwords)

        # update preference file
        preference["like"]["senders"] = list(liked_senders)
        preference["like"]["subjects"] = list(liked_subjects)
        preference["dislike"]["senders"] = list(disliked_senders)
        preference["dislike"]["subjects"] = list(disliked_subjects)

        with open(preference_path, 'w') as outfile:
            json.dump(preference, outfile)

        with open(train_path, 'w') as outfile:
            json.dump(train, outfile)
    except Exception as e:
        print(e)


if __name__ == '__main__':
    main()

# About
An electron application to allow user get their personal gmails and train them to find which email was interested over the time.

## On development: 
Python:
    - Email are now updated based on liked and unliked senders and subject's keywords
    - Need a better way to learn user's preference
    
NodeJS:
    - Unliked email will be removed
    - Liked email is shown "being liked" next time open the app
    - Better UI

## The structure of this project is

```
.
|--app
|    |-- main.js
|    |-- package.json
|    |-- renderer.js
|    |
|    |-- pycalc 
|    |   |-- readmail.py
|    |   |-- parsemail.py
|    |   |-- modifymail.py
|    |   `-- loadmore.py
|    |
|    |-- assets
|    |   |-- credentials
|    |       |-- client_secret.json
|    |   |-- css
|    |   |-- icons
|    |   |-- images
|    |   `-- js
|    |
|    |-- templates 
|    |   |-- signin.html
|    |   |-- download.html
|    |   |-- processing.html
|    |   `-- email.html
|    |
|    |-- npm_requirements.txt
|    |-- python_requirements.txt
|    `-- README.md
`--venv
```

# Requirements
## To be installed by yourself
```
python 3.6
virtualenv #recommended
node and npm
```

## Update/Additions - install with scripts
```
# Recommended: Update within virtualenv

# for npm
sudo npm install --unsafe-perm=true --allow-root -r npm_requirements.txt
npm install # will install anything logged in package-log.json
# for python
pip install -r python_requirements
```

# Run
```
npm start

# if prefer global electron, one must first install
sudo npm install -g electron --unsafe-perm=true --allow-root
# then run using
electron .
```



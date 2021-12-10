# Survey System (Demo)

> **Only for learning purpose and do not use for any formal application!**

## Current status

- [x] Create survey by administrator.
- [x] Render question list page for user.
- [x] Register, Login/out.
- [x] Store user information in MySQL database.
- [x] Use async/await keyword to avoid the callback hell problem.
- [x] About page, Right bar, Friends page.
- [x] Submit the data filled in by user.
- [x] Activating/Deactivating Surveys.
- [ ] Multi Language Support. (Currently Simplified Chinese)
(Working in progress)

## Usage

1. Install MySQL and setup user name and password.

2. Clone this repository and install its dependencies by using `npm install`.

``` shell
$ git clone https://github.com/STARRY-S/Survey.git
$ cd Survey
$ mkdir -p ./data/user
$ npm install
```

3. Edit `utils.js`, set the username, password, db name of your mysql database.

P.S. You can change the default port number in `app.js`.

4. Use `npm start` to start this program, it will initialize database 
by itself automatically, and the default admin account name is `admin`, with its
default password `testpassword`.

## Others

This project is just for learning purposes, and it is unsafe and unstable, 
still need improvements.

> License MIT

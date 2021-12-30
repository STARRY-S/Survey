# Questionnaire Survey System

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

1. Setup a MySQL server, create an empty database firstlly.

2. Clone this repository and install its dependencies by using `npm install`.

``` shell
$ git clone https://github.com/STARRY-S/Survey.git
$ cd Survey
$ npm install
```

3. Move `server-config.yml.temp` to `server-config.yml`, set server properties.

``` shell
$ mv server-config.yml.temp server-config.yml
$ vim server-config.yml
```

4. Use `npm start` to start this program, it will initialize the database
automatically, and the default admin account name is `admin`, with its
default password `testpassword`.

## Others

I created this project just for learning purposes,
and used it as the homework of my software engineering course,
so it is currently **unsafe** and **unstable**, still need lots of improvements.

> License MIT

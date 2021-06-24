# Survey

> Still working in progress.

## Current status

- [x] Create survey by administrator.
- [x] Render question list page for user.
- [x] Register, Login/out.
- [x] Store user information in MySQL database.
- [x] Use async/await keyword to avoid the callback hell problem.
- [x] About page, Right bar, Friends page.
- [x] Submit the data filled in by user.
- [x] Activating/Deactivating Surveys.
- [ ] ~~Multi Language Support. (Currently Simplified Chinese)~~

## Usage

1. Install MySQL and setup user name and password.

2. Create `admin`, `student`, `teacher`, `question` table.

Here is an example:

``` sql
create table admin (
    id int NOT NULL AUTO_INCREMENT,
    register_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    name VARCHAR(63) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    PRIMARY KEY (id)
);

create table student (
    id INT NOT NULL AUTO_INCREMENT,
    student_id VARCHAR(20) NOT NULL,
    register_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    name VARCHAR(63) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(63),
    info VARCHAR(255),
    sex VARCHAR(8) DEFAULT '男',
    age INT,
    profession VARCHAR(63),
    class VARCHAR(50),
    school VARCHAR(50),
    PRIMARY KEY (id)
);

create table teacher (
    id INT NOT NULL AUTO_INCREMENT,
    teacher_id VARCHAR(20) NOT NULL,
    register_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    name VARCHAR(63) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(63),
    info VARCHAR(255),
    sex VARCHAR(8) DEFAULT '男',
    age INT,
    PRIMARY KEY (id)
);

create table question (
    id INT AUTO_INCREMENT NOT NULL,
    user_type INT NOT NULL DEFAULT 0,
    open BOOLEAN NOT NULL DEFAULT FALSE,
    title VARCHAR(50) NOT NULL,
    created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    filename VARCHAR(128) NOT NULL,
    PRIMARY KEY(id)
);

create table studentdata (
    id INT AUTO_INCREMENT NOT NULL,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    filename VARCHAR(128) NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY (user_id)
      REFERENCES student(id)
      ON DELETE CASCADE,
    FOREIGN KEY (question_id)
      REFERENCES question(id)
      ON DELETE CASCADE
);

create table teacherdata (
    id INT AUTO_INCREMENT NOT NULL,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    filename VARCHAR(128) NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY (user_id)
      REFERENCES teacher(id)
      ON DELETE CASCADE,
    FOREIGN KEY (question_id)
      REFERENCES question(id)
      ON DELETE CASCADE
);
```
And the tables in your database should looks like this:

``` text
mysql> show tables;
+---------------------+
| Tables_in_database  |
+---------------------+
| admin               |
| question            |
| student             |
| studentdata         |
| teacher             |
| teacherdata         |
+---------------------+
6 rows in set (0.00 sec)
```

Then clone this repository and install dependencies by `npm install`.

``` shell
$ git clone https://github.com/STARRY-S/Survey.git
$ cd Survey
$ mkdir ./data && mkdir ./data/user
$ npm install
$ npm start     # visit http://127.0.0.1:3000
```

Edit `utils.js` according to the username and password you set.

You can edit default port number in `app.js`.

## Others

This project is just for learning purposes, and may be unsafe and unstable.

> License MIT

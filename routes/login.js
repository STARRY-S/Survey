const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const router = express.Router();
const mysql = require('mysql');

let connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'starrys',
	password : 'testpassword',
    database : 'survey',
});

connection.connect((err) => {
    if (err) throw err;
    console.log(`Database connect successfully.`);
});

router.use((req, res, next) => {
    next();
});

router.get('/', (req, res) => {
    if (!req.session.loggedin) {
        res.locals.title = "登录 | 问卷调查系统";
        res.render('login');
    }
    else {
        res.locals.title = "登录成功 | 问卷调查系统";
        res.render('success');
    }
});

router.post('/auth', (req, res) => {
  // Insert Login Code Here
  let name = req.body.username;
  let pwd  = req.body.password;
  let type = req.body.type;

  if (name && pwd) {
		connection.query(
            `select id from admin where name="${name}" and password="${pwd}"`,
            (error, results, fields) => {
            if (error) console.error(error);
			if (results && results.length > 0) {
				req.session.loggedin = true;
				req.session.username = name;
                res.locals.title = "登录成功 | 问卷调查系统";
				res.render('success');
			} else {
                // res.locals.title = "登录失败 | 问卷调查系统";
                res.send('<script>\
                    alert("Incorrect Username/Password")</script>');
			}
			res.end();
		});
	} else {
		res.send('Please enter Username and Password!');
		res.end();
	}

  // res.json([
  //     `Username: ${username}`,
  //     `Password: ${password}`
  // ]);
});

module.exports = router;

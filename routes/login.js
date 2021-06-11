const express = require('express');
const session = require('express-session');
const mysql   = require('../database');
const router  = express.Router();

router.get('/', (req, res) => {
	let loggedin = req.session.loggedin;
	res.locals.loggedin = loggedin;
    if (!loggedin) {
        res.render('login', {
					pageTitle: "请登录",
				});
    }
    else {
        res.redirect('/');
    }
});

router.post('/auth', (req, res) => {
  let name = req.body.username;
  let pwd  = req.body.password;
  let type = req.body.type;

	// TODO: login via name or email or phone
  if (name && pwd) {
		let sql = `select id from ${type} where ` +
			`(name="${name}" AND password="${pwd}")`;
		mysql.query(sql, (error, results, fields) =>
		{
			if (error) console.error(error);
			if (results && results.length > 0) {
				req.session.loggedin = true;
				req.session.username = name;
				req.session.type = type;
				res.locals.userType  = type;
				res.redirect('/');
			} else {
				res.render('login', {
					pageTitle: "登录失败",
					errorMessage: "请检查帐号及密码以及用户类型是否正确",
				});
			}
			res.end();
		});
	} else {
		res.render('login', {
			pageTitle: "登录失败",
			errorMessage: "请检查帐号及密码以及用户类型是否正确",
		});
		res.end();
	}
});

module.exports = router;

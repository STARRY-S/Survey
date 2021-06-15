const express = require('express');
const session = require('express-session');
const mysql   = require('../database');
const router  = express.Router();

router.get('/', (req, res) => {
	const title = req.query.title;
	const loggedin = req.session.loggedin;
    if (!loggedin) {
        res.render('login', {
					pageTitle: "请登录",
					surveyName: title,
				});
    } else {
        res.redirect('/');
    }
});

router.post('/auth', (req, res) => {
	const title = req.query.title;
  const name  = req.body.username;
  const pwd   = req.body.password;
  const type  = req.body.type;

	// TODO: login via name or email or phone
  if (name && pwd) {
		let sql = `select id from ${type} where ` +
			`(name="${name}" AND password="${pwd}")`;
		mysql.query(sql, (error, results, fields) =>
		{
			if (error) console.error(error);
			if (results && results.length > 0) {
				req.session.loggedin = true;
				// create a user object which stores username and usertype.
				req.session.user = {
					name: name,
					type: type,
				};
				// res.locals.user = req.session.user;
				res.redirect(title ? `/?title=${title}` : '/');
			} else {
				res.render('login', {
					pageTitle: "登录失败",
					errorMessage: "请检查帐号及密码以及用户类型是否正确",
				});
			}
			// res.end();
		});
	} else {
		res.render('login', {
			pageTitle: "登录失败",
			errorMessage: "请检查帐号及密码以及用户类型是否正确",
		});
		// res.end();
	}
});

module.exports = router;

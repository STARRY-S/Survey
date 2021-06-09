const express = require('express');
const session = require('express-session');
const mysql   = require('../database');
const router  = express.Router();

router.get('/', (req, res) => {
	let loggedin = req.session.loggedin;
	res.locals.loggedin = loggedin;
    if (!loggedin) {
        res.locals.pageTitle = "请登录";
        res.render('login');
    }
    else {
        res.redirect('/');
    }
});

router.post('/auth', (req, res) => {
  let name = req.body.username;
  let pwd  = req.body.password;
  let type = req.body.type;
	console.log(type);

	// let tableName = '';
	// switch(type) {
	// 	case 'student':
	// 		tableName = 'student';
	// 		break;
	// 	case 'teacher':
	// 		tableName = 'teacher';
	// 		break;
	// 	case 'admin'  :
	// 		tableName = 'admin';
	// 	default:
	// 		tableName = 'student';
	// 		break;
	// }

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
				res.redirect('/');
			} else {
				res.locals.pageTitle = "登录失败";
				res.locals.errorMessage = "请检查帐号及密码以及用户类型是否正确";
				res.render('login');
			}
			res.end();
		});
	} else {
		res.locals.pageTitle = "登录失败";
		res.locals.errorMessage = "请输入用户名和密码";
		res.render('login');
		res.end();
	}
});

module.exports = router;

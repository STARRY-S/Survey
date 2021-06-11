const express = require('express');
const session = require('express-session');
const mysql   = require('../database');
const fs 			= require('fs');
const router  = express.Router();
const hashCode= require('../hashcode');

router.get('/', (req, res) => {
	res.send("admin");
});

router.get('/add', (req, res) => {
  let loggedin = req.session.loggedin;
  let userType = req.session.type || 'student';

  if (!req.session.loggedin || userType !== 'admin') {
    res.status(403).render('error', { errorCode: 403 });
    return;
  }

  res.render('admin/create_survey', {
		pageTitle: "新建问卷",
		loggedin: loggedin,
	});
});

router.post('/add_clear', (req, res) => {
  let loggedin = req.session.loggedin;
  let userType = req.session.type || 'student';

  if (!req.session.loggedin || userType !== 'admin') {
    res.status(403).render('error', { errorCode: 403 });
    return;
  }

  req.session.obj_list = [];
  res.render('admin/create_survey', {
		pageTitle: "新建问卷",
		loggedin: loggedin,
	});
});

router.post('/add_1', (req, res) => {
  let loggedin = req.session.loggedin;
  let userType = req.session.type || 'student';

  if (!req.session.loggedin || userType !== 'admin') {
    res.status(403).render('error', { errorCode: 403 });
    return;
  }

	let s_title = req.body.s_title;
  if (typeof req.session.obj_list === 'undefined'
			|| req.session.obj_list.length < 1) {
    req.session.obj_list = [];
		req.session.obj_list.push(s_title);
  }

  let obj = {
    title: req.body.c_title,
    type: req.body.c_type,
  };

  // console.log(req.session.obj_list);
  if (obj.type !== "input") {
    obj.q_num = req.body.q_num;
    obj.q_list = [];
    res.locals.number = obj.q_num;
    req.session.obj_list.push(obj);
    res.render('admin/add_select', {
			pageTitle: "设置选项",
			loggedin: loggedin,
		});
  } else {
    req.session.obj_list.push(obj);
    res.render('admin/create_survey', {
			pageTitle: "新建问卷",
			loggedin: loggedin,
			obj_list: req.session.obj_list,
		});
  }
});

router.post('/add_2', (req, res) => {
  let loggedin = req.session.loggedin;
  let userType = req.session.type || 'student';

  if (!req.session.loggedin || userType !== 'admin') {
    res.status(403).render('error', {
			errorCode: 403,
		});
    return;
  }

	let list = req.session.obj_list;
	if (list.length <= 1) {
		res.status(400).render('error', {
			errorCode: 400,
		});
		return;
	}

  let obj = list[list.length - 1];

  for (let i = 1; i <= obj.q_num; i++) {
    obj.q_list.push(req.body[`select_${i}`]);
  }

  list[list.length - 1] = obj;
  req.session.obj_list = list;
  res.render('admin/create_survey', {
		pageTitle: "新建问卷",
		loggedin: loggedin,
		obj_list: req.session.obj_list,
	});
});

router.post('/submit', (req, res) => {
	let loggedin = req.session.loggedin;
  let userType = req.session.type || 'student';

  if (!req.session.loggedin || userType !== 'admin') {
    res.status(403).render('error', {
			errorCode: 403,
		});
    return;
  }

	let obj_list = req.session.obj_list;
	let survey_name = obj_list[0] || 'default';
	let filename = 'data/' + hashCode(survey_name) + '.json';

	let sql = `INSERT INTO question (title, filename) VALUES ("${obj_list[0]}",` +
			` "${filename}")`;
	fs.writeFile(filename, JSON.stringify(obj_list), function (err) {
	  if (err) console.error(err);

		mysql.query(sql, (error, results, fields) => {
			if (error) console.error(error);
			res.redirect("/");
		});

	});
});

module.exports = router;

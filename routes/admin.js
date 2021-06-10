const express = require('express');
const session = require('express-session');
const mysql   = require('../database');
const router  = express.Router();

router.get('/', (req, res) => {
	res.send("admin");
});

router.get('/add', (req, res) => {
  let loggedin = req.session.loggedin;
  let userType = req.session.type || 'student';

  if (!req.session.loggedin || userType !== 'admin') {
    res.status(500).render('error');
    return;
  }

  res.locals.pageTitle = "新建问卷";
  res.render('admin/create_survey');
});

router.post('/add_clear', (req, res) => {
  let loggedin = req.session.loggedin;
  let userType = req.session.type || 'student';

  if (!req.session.loggedin || userType !== 'admin') {
    res.status(500).render('error');
    return;
  }

  req.session.obj_list = [];
  req.render('admin/create_survey');
});

router.post('/add_1', (req, res) => {
  let loggedin = req.session.loggedin;
  let userType = req.session.type || 'student';

  if (!req.session.loggedin || userType !== 'admin') {
    res.status(500).render('error');
    return;
  }

  if (typeof req.session.obj_list === 'undefined') {
    req.session.obj_list = [];
  }

  let obj = {
    title: req.body.c_title,
    type: req.body.c_type,
  };

  // console.log(obj.type);
  res.locals.pageTitle = "设置选择题";
  if (obj.type !== "input") {
    obj.q_num = req.body.q_num;
    obj.q_list = [];
    res.locals.number = obj.q_num;
    req.session.obj_list.push(obj);
    res.render('admin/add_select');
  } else {
    req.session.obj_list.push(obj);
    res.locals.obj_list = req.session.obj_list;
    res.render('admin/create_survey');
  }
});

router.post('/add_2', (req, res) => {
  let loggedin = req.session.loggedin;
  let userType = req.session.type || 'student';

  if (!req.session.loggedin || userType !== 'admin') {
    res.status(500).render('error');
    return;
  }

  let list = req.session.obj_list;
  // console.log(list);
  let obj = list[list.length - 1];

  for (let i = 1; i <= obj.q_num; i++) {
    obj.q_list.push(req.body[`select_${i}`]);
  }

  list[list.length - 1] = obj;
  // console.log(list);

  req.session.obj_list = list;
  res.locals.obj_list = list;
  res.render('admin/create_survey');
});

module.exports = router;

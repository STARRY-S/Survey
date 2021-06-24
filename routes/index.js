"use strict";

const express = require('express');
const session = require('express-session');
const pool    = require('../utils').pool;
const utils   = require('../utils').utils;
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();

const openQuestionFile = (filename) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if (err) reject(err);

      const obj_list = JSON.parse(data || "[]");
      resolve(obj_list);
    });
  });
};

const getQuestionFileName = (title) => {
  let sql = `select filename from question where title = ` + pool.escape(title);
  return new Promise((resolve, reject) => {
    pool.query(sql, (error, results, fields) => {
      if (error) reject(error);
      let filename = results[0].filename;
      resolve(filename);
    });
  });
};

router.get('/', async (req, res) => {
  const title = req.query.title;
  const loggedin = req.session.loggedin;
  let toast = req.session.toast;
  if (toast) {
    req.session.toast = undefined;
  }

  if (!loggedin) {
    res.redirect(title ? `/login?title=${title}` : `/login`);
    return;
  }

  if (typeof title !== 'undefined') {
    try {
      const filename = await getQuestionFileName(title);
      const obj_list = await openQuestionFile(filename);
      res.locals.obj_list = obj_list;
      req.session.obj_list = obj_list;
      res.render('index');
    } catch (err) {
      console.error(err);
      res.status(500).render('error', {errorCode: 500});
    }
    return;
  }

  let type_code = 0;
  switch (req.session.user.type) {
    case 'student': type_code = 1; break;
    case 'teacher': type_code = 2; break;
    default: type_code = 0;
  }

  let sql = `select title from question where ` +
      `((user_type = ${type_code} or user_type = 0) and open = true)`;
  try {
    const results = await utils.sqlQuery(sql);
    let question_list = [];
    for (let i = 0; i < results.length; ++i) {
      question_list.push(results[i].title);
    }
    res.render("index", {
      question_list: question_list,
      toast: toast,
    });
  } catch(err) {
    res.status(500).render('error', {errorCode: 500});
  };
});

router.get('/invite', (req, res) => {
  res.render('invite', {
    pageTitle: "分享链接",
  });
});

router.get('/about', (req, res) => {
	res.render('about', { loggedin: req.session.loggedin });
});

router.get('/friends', (req, res) => {
	res.render('friends', { loggedin: req.session.loggedin });
});

router.get('/error', (req, res) => {
	res.status(200).render('error', { errorCode: 200 } );
});

module.exports = router;

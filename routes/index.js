const express = require('express');
const session = require('express-session');
const mysql   = require('../database');
const fs      = require('fs');
const router = express.Router();

const questionPage = (req, res, title) => {
  if (typeof title === 'undefined' || title == null) {
    title = "*";
  }

  let sql = `select filename from question where title="${title}"`;
  mysql.query(sql, (error, results, fields) => {
    if (error) console.error(error);
    let filename = results[0].filename;

    fs.readFile(filename, (err, data) => {
      const obj_list = JSON.parse(data);
      res.locals.obj_list = obj_list;
      res.render('index');
    });
  });
};

router.get('/', (req, res) => {
  const title = req.query.title;
  const loggedin = req.session.loggedin;

  if (!loggedin) {
    res.redirect(title ? `/login?title=${title}` : `/login`);
    return;
  }

  if (typeof title !== 'undefined') {
    questionPage(req, res, req.query.title);
    return;
  }

  let sql = `select title from question`;
  mysql.query(sql, (error, results, fields) => {
    if (error) console.error(error);

    let question_list = [];
    for (let i = 0; i < results.length; ++i) {
      question_list.push(results[i].title);
    }
    res.render("index", { question_list: question_list } );
  });
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

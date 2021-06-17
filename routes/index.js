const express = require('express');
const session = require('express-session');
const pool    = require('../utils').pool;
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

router.get('/', (req, res) => {
  const title = req.query.title;
  const loggedin = req.session.loggedin;

  if (!loggedin) {
    res.redirect(title ? `/login?title=${title}` : `/login`);
    return;
  }

  if (typeof title !== 'undefined') {
     getQuestionFileName(title)
      .then(filename => openQuestionFile(filename))
      .then(obj_list => {
        res.locals.obj_list = obj_list;
        req.session.obj_list = obj_list;
        res.render('index');
      }).catch(err => console.error(err));
    return;
  }

  let type_code = 0;
  switch (req.session.user.type) {
    case 'student': type_code = 1; break;
    case 'teacher': type_code = 2; break;
    default: type_code = 0;
  }

  let sql = `select title from question where ` +
      `(user_type = ${type_code} or user_type = 0)`;
  pool.query(sql, (error, results, fields) => {
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

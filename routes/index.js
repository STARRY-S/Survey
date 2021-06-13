const express = require('express');
const session = require('express-session');
const mysql   = require('../database');
const fs      = require('fs');
const router = express.Router();

const questionPage = (req, res, title) => {
  if (typeof title === 'undefined' || title == null) {
    title = "unknow title";
  }

  let sql = `select filename from question where title="${title}"`;
  mysql.query(sql, (error, results, fields) => {
    if (error) console.error(error);
    let filename = results[0].filename;

    fs.readFile(filename, (err, data) => {
      const obj_list = JSON.parse(data);
      res.locals.obj_list = obj_list;
      // console.log(obj_list);
      res.render('index');
    });
  });
};

router.get('/', (req, res) => {
  let loggedin = req.session.loggedin;
  // let userType = req.session.type || 'student';
  // res.locals.userType = userType;
  // res.locals.loggedin = loggedin;
	if (!loggedin) {
		res.redirect('/login');
    return;
	}

  // console.log(req.query);
  if (typeof req.query.title !== 'undefined') {
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

module.exports = router;

const express = require('express');
const session = require('express-session');
const mysql   = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  let loggedin = req.session.loggedin;
  let userType = req.session.type || 'student';

  res.locals.userType = userType;
  res.locals.loggedin = loggedin;
	if (!loggedin) {
		res.redirect('/login');
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

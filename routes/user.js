const express = require('express');
const session = require('express-session');
const mysql   = require('../database');
const router  = express.Router();

router.get('/', (req, res) => {
  let loggedin = req.session.loggedin;
  // res.locals.loggedin = loggedin;
  console.log("/user");
	res.send("user");
});

router.post('/submit', (req, res) => {
  console.log(req.body);
  res.json(req.body);
});

module.exports = router;

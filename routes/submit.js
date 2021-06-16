const express = require('express');
const session = require('express-session');
const pool    = require('../database');
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();

router.post('/', (req, res) => {
  const loggedin = req.session.loggedin;
  const user     = req.session.user;
  if (!loggedin) {
    res.status(403).render('error', { errorCode: 403 });
    return;
  }

  // console.log(req.body);
  for (const obj in req.body) {
    console.log(req.body[obj]);
  }
  res.json(req.body);
});

module.exports = router;

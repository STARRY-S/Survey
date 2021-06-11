const express = require('express');
const session = require('express-session');
const router = express.Router();

router.get('/', (req, res) => {
  let loggedin = req.session.loggedin;
  if (loggedin) {
    req.session.loggedin = false;
    req.session.destroy();
  }
  res.redirect("/login");
});

module.exports = router;

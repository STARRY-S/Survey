const express = require('express');
const session = require('express-session');
const router = express.Router();

router.get('/', (req, res) => {
  let loggedin = req.session.loggedin;
  // about
});

module.exports = router;

const express = require('express');
const session = require('express-session');
const router = express.Router();

router.get('/', (req, res) => {
  let loggedin = req.session.loggedin;
  res.locals.loggedin = loggedin;
	if (loggedin) {
		res.render('index');
	} else {
		res.redirect('/login');
	}
});

module.exports = router;

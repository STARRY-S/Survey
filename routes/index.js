const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const router = express.Router();

/* GET home page. */
// router.get('/', (req, res) => {
//   res.redirect('/');
// });

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

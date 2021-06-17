const express = require('express');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const FileStore = require('session-file-store')(session);
const https = require('https');

const loginRouter  = require('./routes/login');
const logoutRouter = require('./routes/logout');
const indexRouter  = require('./routes/index');
const regRouter    = require('./routes/register');
const adminRouter  = require('./routes/admin');
const submitRouter = require('./routes/submit');
const dialogRouter = require('./routes/dialog');

app.locals.site = {
		title: 			 '高校问卷调查管理系统',
		description: '想了一下午也没想出来啥宣传标语来。',
};

const filestoreOpetions = {
	logFn: () => {},
};

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
	store: new FileStore(filestoreOpetions),	// stores session into file
	secret: 'secret',							// session secret code
	resave: true,									// force session to be saved
	saveUninitialized: false,			// do not save uninitialized connection
	rolling: true,								// Force the session identifier cookie to be set
	 															// on every response
	cookie: {
		// secure: true,
		sameSite: 'strict',					// Cookies will only be sent in a first-party
																// context and not be sent along with requests
																// initiated by third party websites.
		maxAge: 1000 * 60 * 60 * 24,	// maxAge: 24 hours
	},
}));

// make a user object avalable on all templates.
app.use((req, res, next) => {
  res.locals.user		  = req.session.user;
	res.locals.loggedin = req.session.loggedin;
  next();
});

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/register', regRouter);
app.use('/admin', adminRouter);
app.use('/submit', submitRouter);
app.use('/dialog', dialogRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { errorCode: 500 });
});

// Render 404 Page
app.use((req, res, next) => {
	res.locals.errorCode = 404;
	res.status(404).render('error');
});

const port = 3000;

// Function to listen on the port
app.listen(port, () => console.log(`This app is listening on port ${port}`));

// https.createServer({
// 	key: null,
// 	cert: null,
// }, app)
// .listen(port, () => {
// 	console.log(`This app is listening on port ${port}`);
// });

module.exports = app;

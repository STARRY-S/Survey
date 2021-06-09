const express = require('express'); // Include ExpressJS
const app = express(); // Create an ExpressJS app
const session = require('express-session');
const bodyParser = require('body-parser'); // Middleware

const loginRouter  = require('./routes/login');
const logoutRouter = require('./routes/logout');
const indexRouter  = require('./routes/index');
const regRouter    = require('./routes/register');

app.locals.site = {
		title: 			 '高校问卷调查系统',
		description: '欢迎大家填写问卷。',
};

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/register', regRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('出错了！');
});

const port = 3000

// Function to listen on the port
app.listen(port, () => console.log(`This app is listening on port ${port}`));

module.exports = app;

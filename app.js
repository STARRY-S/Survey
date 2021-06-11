const express = require('express'); // Include ExpressJS
const app = express(); // Create an ExpressJS app
const session = require('express-session');
const bodyParser = require('body-parser'); // Middleware

const loginRouter  = require('./routes/login');
const logoutRouter = require('./routes/logout');
const indexRouter  = require('./routes/index');
const regRouter    = require('./routes/register');
const userRouter   = require('./routes/user');
const adminRouter  = require('./routes/admin');

app.locals.site = {
		title: 			 '高校问卷调查系统',
		description: '这是一条宣传标语。',
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
app.use('/user', userRouter);
app.use('/admin', adminRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { errorCode: 500 });
});

app.get('/about', (req, res) => {
	res.render('about');
});

app.get('/friends', (req, res) => {
	res.render('friends');
})

app.get('/200', (req, res) => {
	res.status(200).render('error', { errorCode: 200 } );
})

const port = 3000;

// Function to listen on the port
app.listen(port, () => console.log(`This app is listening on port ${port}`));

module.exports = app;

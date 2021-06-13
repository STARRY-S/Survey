const mysql = require('mysql');

let pool = mysql.createPool({
	connectionLimit : 10,
	host     				: 'localhost',
	user     				: 'starrys',
	password 				: 'testpassword',
  database 				: 'survey',
});

// pool.connect((err) => {
//   if (err) throw err;
//   console.log(`Database connect successfully.`);
// });

module.exports = pool;

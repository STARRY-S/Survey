const mysql = require('mysql');

let connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'starrys',
	password : 'testpassword',
  database : 'survey',
});

connection.connect((err) => {
  if (err) throw err;
  console.log(`Database connect successfully.`);
});

module.exports = connection;

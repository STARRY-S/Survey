const mysql = require('mysql');
const fs 		= require('fs');

// Edit your MySQL user and password here:
const pool = module.exports.pool = mysql.createPool({
	connectionLimit : 10,
	host     				: 'localhost',
	user     				: 'starrys',
	password 				: 'testpassword',
  database 				: 'survey',
});

module.exports.utils = {
  hashCode: (s) => {
    var h = 0, l = s.length, i = 0;
    if ( l > 0 )
      while (i < l)
        h = (h << 5) - h + s.charCodeAt(i++) | 0;
    return h;
  },

  sqlQuery: (sql, list) => {
    return new Promise((resolve, reject) => {
      pool.query(sql, list, (error, results, fields) => {
        if (error)  reject(error);
        resolve(results);
      });
    });
  },

  writeFile: (filename, data) => {
    return new Promise((resolve, reject) => {
      fs.writeFile(filename, data, (err) => {
        if (err) reject(err);
        resolve(true);
      });
    });
  },

  readFile: (filename) => {
    return new Promise((resolve, reject) => {
      fs.readFile(filename, (err, data) => {
        if (err) reject(err);
        resolve(data);
      });
    })
  },
};

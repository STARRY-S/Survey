"use strict";

const mysql = require("mysql2");
const fs    = require("fs");

// Change your MySQL host, username, password and db name here:
const pool = module.exports.pool = mysql.createPool({
    connectionLimit : 10,
    host             : "localhost",
    user             : "starrys",
    password         : "testpassword",
    database         : "survey",
});

function keepAlive() {
    pool.getConnection((err, connection) => {
        if(err) {
            console.error(err);
        }
        connection.query("SELECT 1", (err, rows) => {
            connection.release();
            if (err) {
                console.error("Keep Alive Query Error: ", err);
            }
        });
    });
}
setInterval(keepAlive, 1000 * 50);  // Prevent the auto disconnection.

function initializeDatabase() {
    // TODO: Check if database is initialized.
    let sql = "create table if not exists admin ("
        + " id int NOT NULL AUTO_INCREMENT,"
        + " register_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),"
        + " name VARCHAR(63) NOT NULL,"
        + " password VARCHAR(255) NOT NULL,"
        + " phone VARCHAR(15),"
        + " PRIMARY KEY (id)"
        + " );";
    pool.execute(sql);
    sql = "create table if not exists student ("
        + " id INT NOT NULL AUTO_INCREMENT,"
        + " student_id VARCHAR(20) NOT NULL,"
        + " register_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),"
        + " name VARCHAR(63) NOT NULL,"
        + " password VARCHAR(255) NOT NULL,"
        + " phone VARCHAR(15) NOT NULL,"
        + " email VARCHAR(63),"
        + " info VARCHAR(255),"
        + " sex VARCHAR(8) DEFAULT '男',"
        + " age INT,"
        + " profession VARCHAR(63),"
        + " class VARCHAR(50),"
        + " school VARCHAR(50),"
        + " PRIMARY KEY (id)"
        + " );";
    pool.execute(sql);
    sql = "create table if not exists teacher ("
        + " id INT NOT NULL AUTO_INCREMENT,"
        + " teacher_id VARCHAR(20) NOT NULL,"
        + " register_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),"
        + " name VARCHAR(63) NOT NULL,"
        + " password VARCHAR(255) NOT NULL,"
        + " phone VARCHAR(15) NOT NULL,"
        + " email VARCHAR(63),"
        + " info VARCHAR(255),"
        + " sex VARCHAR(8) DEFAULT '男',"
        + " age INT,"
        + " PRIMARY KEY (id)"
        + ");"
    pool.execute(sql);
    sql = "create table if not exists question ("
        + " id INT AUTO_INCREMENT NOT NULL,"
        + " user_type INT NOT NULL DEFAULT 0,"
        + " open BOOLEAN NOT NULL DEFAULT FALSE,"
        + " title VARCHAR(50) NOT NULL,"
        + " created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),"
        + " filename VARCHAR(128) NOT NULL,"
        + " PRIMARY KEY(id)"
        + " );";
    pool.execute(sql);
    sql = "create table if not exists studentdata ("
        + " id INT AUTO_INCREMENT NOT NULL,"
        + " user_id INT NOT NULL,"
        + " question_id INT NOT NULL,"
        + " updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),"
        + " filename VARCHAR(128) NOT NULL,"
        + " PRIMARY KEY(id),"
        + " FOREIGN KEY (user_id)"
        + "   REFERENCES student(id)"
        + "   ON DELETE CASCADE,"
        + " FOREIGN KEY (question_id)"
        + "   REFERENCES question(id)"
        + "   ON DELETE CASCADE"
        + " );";
    pool.execute(sql);
    sql = "create table if not exists teacherdata ("
        + " id INT AUTO_INCREMENT NOT NULL,"
        + " user_id INT NOT NULL,"
        + " question_id INT NOT NULL,"
        + " updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),"
        + " filename VARCHAR(128) NOT NULL,"
        + " PRIMARY KEY(id),"
        + " FOREIGN KEY (user_id)"
        + "   REFERENCES teacher(id)"
        + "   ON DELETE CASCADE,"
        + " FOREIGN KEY (question_id)"
        + "   REFERENCES question(id)"
        + "   ON DELETE CASCADE"
        + " );"
    pool.execute(sql);
    sql = "select count(*) as num from admin;";
    pool.query(sql, (err, results) => {
        if (err) {
            console.error(err);
        }
        // console.log(results[0]["num"]);
        if (results.length > 0 && results[0]["num"] === 0) {
            let sql = "insert into admin (name, password)"
                + " values ('admin', 'testpassword')";
            pool.execute(sql);
            console.log("Created default admin account.");
        }
    });
}
initializeDatabase();

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

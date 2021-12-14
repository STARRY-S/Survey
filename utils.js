"use strict";

const mysql = require("mysql2");
const fs    = require("fs");
const bcrypt = require('bcrypt');

// Change here for enabling SSL Certificate
const SSL_PRIVATE_KEY_PATH = "";
const SSL_PUBLIC_KEY_PATH = "";

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
            return;
        }
        if (typeof connection === "undefined") {
            return;
        }
        connection.ping();
        connection.release();
    });
}
setInterval(keepAlive, 1000 * 50);  // Prevent the auto disconnection.

let utils = {
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

    cryptPassword: (password) => {
        return new Promise((resolve, reject) => {
            bcrypt.genSalt(10, (err, salt) => {
                if (err) 
                    reject(err);
    
                bcrypt.hash(password, salt, (err, hash) => {
                    if (err) 
                        reject(err);
                    resolve(hash);
                });
            });
        })
    },

    comparePassword: (plainPass, hashword) => {
        return new Promise((resolve, reject) => {
            bcrypt.compare(plainPass, hashword, (err, isPasswordMatch) => {   
                return err == null ?
                    resolve(isPasswordMatch) :
                    reject(err);
            });
        });
    },

    initSSLCertificate: () => {
        let privatekey = "";
        let publickey = "";
        let credentials = {};
        if (SSL_PUBLIC_KEY_PATH === "" || SSL_PRIVATE_KEY_PATH === "") {
            console.log("SSL Certificate disabled.");
            return null;
        }

        try {
            privatekey = fs.readFileSync(SSL_PRIVATE_KEY_PATH);
            publickey = fs.readFileSync(SSL_PUBLIC_KEY_PATH);
            if (privatekey == "" || publickey == "") {
                console.error("Failed to read SSL Key files.");
                return null;
            }
        } catch(err) {
            console.error("Failed to read SSL Key files.");
            console.error(err);
            return null;
        }
        credentials["key"] = privatekey;
        credentials["cert"] = publickey;
        return credentials;
    },

};

async function initializeDatabase() {
    // TODO: Check if database is initialized.
    let sql = "create table if not exists admin ("
        + " id int NOT NULL AUTO_INCREMENT,"
        + " register_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),"
        + " name VARCHAR(63) NOT NULL,"
        + " password VARCHAR(255) NOT NULL,"
        + " phone VARCHAR(15),"
        + " PRIMARY KEY (id)"
        + " );";
    await utils.sqlQuery(sql);
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
    await utils.sqlQuery(sql);
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
    await utils.sqlQuery(sql);
    sql = "create table if not exists question ("
        + " id INT AUTO_INCREMENT NOT NULL,"
        + " user_type INT NOT NULL DEFAULT 0,"
        + " open BOOLEAN NOT NULL DEFAULT FALSE,"
        + " title VARCHAR(50) NOT NULL,"
        + " created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),"
        + " filename VARCHAR(128) NOT NULL,"
        + " PRIMARY KEY(id)"
        + " );";
    await utils.sqlQuery(sql);
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
    await utils.sqlQuery(sql);
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
    await utils.sqlQuery(sql);
    sql = "select count(*) as num from admin;";
    pool.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return;
        }
        // console.log(results[0]["num"]);
        if (results.length > 0 && results[0]["num"] === 0) {
            let sql = "insert into admin (name, password)"
                + " values ('admin', ?)";
            try {
                let hash = bcrypt.hashSync("testpassword", 10);
                pool.execute(sql, [hash]);
                console.log("Created default admin account.");
            } catch (err) {
                console.error(err);
            }
        }
    });
}
initializeDatabase();

module.exports.utils = utils;
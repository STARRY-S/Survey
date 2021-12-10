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
            connection.end();
            if (err) {
                console.error("Keep Alive Query Error: ", err);
            }
        });
    });
}
setInterval(keepAlive, 1000 * 30);  // Prevent the auto disconnection.

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

    initializeDatabase : () => {
        ;
    },
};

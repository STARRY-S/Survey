"use strict";

const mysql = require("mysql2");
const fs    = require("fs");
const YAML  = require("yaml");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const CONFIG_PATH = "server-config.yml";

let config;
try {
    config = YAML.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
} catch(err) {
    console.error(err);
    console.error("FATAL: failed to read config file: " + CONFIG_PATH);
    process.exit(1);
}

const pool = module.exports.pool = mysql.createPool({
    connectionLimit : config.mysql.connection_limit,
    host            : config.mysql.host,
    user            : config.mysql.user,
    password        : config.mysql.password,
    database        : config.mysql.database,
});

let transporter;
if (config.mail.enable) {
    try {
        transporter = nodemailer.createTransport({
            host: config.mail.host,
            secure: true,
            auth: {
                user: config.mail.user,
                pass: config.mail.password,
            },
        });
    } catch (err) {
        console.error(err);
    }
}

let utils = {
    getConfig: () => {
        return config;
    },

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
        if (!config.ssl.enable || config.ssl.private === ""
            || config.ssl.public === "")
        {
            console.log("SSL Certificate disabled.");
            return null;
        }

        try {
            privatekey = fs.readFileSync(config.ssl.private);
            publickey = fs.readFileSync(config.ssl.public);
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

    sendMail: (options) => {
        return new Promise((resolve, reject) => {
            transporter.sendMail(options, (error, info) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(info);
                }
            });
        });
    },

    sendEmailToAll: () => {
        if (!config.mail.enable) {
            return;
        }
        utils.sendEmailToStudent();
        utils.sendEmailToTeacher();
    },

    sendEmailToStudent: async () => {
        if (!config.mail.enable) {
            return;
        }
        let sql = "select name,email from student where email is not NULL";
        let result = await utils.sqlQuery(sql);
        for (let i = 0; i < result.length; ++i) {
            let name = result[i].name;
            let email = result[i].email;
            let url = config.ssl.enable ? "https" : "http" + "://";
            url += `${config.url}:${config.port}`;
            let options = {
                from: `"${config.title}"<${config.mail.user}>`,
                to: `${email}`,
                subject: `问卷邀请-${config.title}`,
                text: `问卷邀请-${config.title}`,
                html: `<h2>问卷邀请</h2>`
                    + `<hr><br>`
                    + `<p>${name}，您好：</p><br>`
                    + `<p>管理员开放了新的调查问卷，邀请您填写：</p>`
                    + `<p>请<a href="${url}">点击此处</a>访问网站。</p>`
                    + `<p>如果您的浏览器没有响应，请复制以下链接到浏览器中访问：</p><br>`
                    + `<code>${url}</code><br><br>`
                    + `<p>如果您并没有注册本站的帐号，请您忽略本邮件</p>`
                    + `<br><br><p>此致</p><strong>admin</strong>`
            }
            try {
                await utils.sendMail(options);
            } catch(err) {
                console.error(err);
            }
        }
    },

    sendEmailToTeacher: async () => {
        if (!config.mail.enable) {
            return;
        }
        let sql = "select name,email from teacher where email is not NULL";
        let result = await utils.sqlQuery(sql);
        for (let i = 0; i < result.length; ++i) {
            let name = result[i].name;
            let email = result[i].email;
            let url = config.ssl.enable ? "https" : "http" + "://";
            url += `${config.url}:${config.port}`;
            let options = {
                form: `"${config.title}" <${config.mail.user}>`,
                to: `${email}`,
                subject: `问卷邀请-${config.title}`,
                text: `问卷邀请-${config.title}`,
                html: `<h2>问卷邀请</h2>`
                    + `<hr><br>`
                    + `<p>${name}，您好：</p><br>`
                    + `<p>管理员开放了新的调查问卷，邀请您填写：</p>`
                    + `<p>请<a href="${url}">点击此处</a>访问网站。</p>`
                    + `<p>如果您的浏览器没有响应，请复制以下链接到浏览器中访问：</p><br>`
                    + `<code>${url}</code><br><br>`
                    + `<p>如果您并没有注册本站的帐号，请您忽略本邮件</p>`
                    + `<br><br><p>此致</p><strong>admin</strong>`
            }
            try {
                await utils.sendMail(options);
            } catch(err) {
                console.error(err);
            }
        }
    },

};

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

async function initializeDatabase() {
    let sql;
    // sql = "create database if not exist ?";
    // await utils.sqlQuery(sql, [config.mysql.database]);
    sql = "create table if not exists admin ("
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
        + " end_time DATETIME DEFAULT NULL,"
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

// initialize directories
function initDirectories() {
    let dir_list = [];
    dir_list.push("./data");
    dir_list.push("./data/user");
    dir_list.push("./data/upload");

    for (let i = 0; i < dir_list.length; ++i) {
        if (!fs.existsSync(dir_list[i])){
            fs.mkdirSync(dir_list[i]);
        }
    }
}
initDirectories();

// deadline timer
setInterval(async () => {
    let sql = "update question set open = 0 where "
            + " end_time > created_date and end_time < CURRENT_TIMESTAMP()";
    try {
        utils.sqlQuery(sql);
    } catch(err) {
        console.error(err);
    }

}, 60 * 1000);

module.exports.utils = utils;
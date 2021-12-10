"use strict";

const express = require("express");
const session = require("express-session");
const router  = express.Router();
const pool    = require("../utils").pool;

// register page
router.get("/", (req, res) => {
    let loggedin = req.session.loggedin;
    if (res.loggedin) {
        res.redirect("/");
    } else {
        res.render("register/register");
    }
});

router.post("/add", (req, res) => {
    let user = {
        name: req.body.username,
        pwd:  req.body.password,
        phone: req.body.phone,
        type: req.body.type,
    };

    req.session.user = user;
    if (user.type === "teacher")
        res.render("register/teacher");
    else
        res.render("register/student");
});

router.post("/add/student", (req, res) => {
    let user = req.session.user;
    user.student_id = req.body.student_id;
    user.email = req.body.email || null;
    user.sex = req.body.sex || null;
    user.age = req.body.age || null;
    user.school = req.body.school || null;
    user.profession = req.body.profession || null;
    user.class = req.body.class || null;

    pool.query(`INSERT INTO student (student_id, name, password, phone, email,` +
        `sex, age, profession, class) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            user.student_id,
            user.name,
            user.pwd,
            user.phone,
            user.email,
            user.sex,
            user.age,
            user.profession,
            user.class,
        ],
        (error, results, fields) => {
            if (error) console.error(error);
        });

    res.redirect("/");

});

router.post("/add/teacher", (req, res) => {
    let user = req.session.user;
    user.teacher_id = req.body.teacher_id;
    user.email = req.body.email || null;
    user.sex = req.body.sex || null;
    user.age = req.body.age || null;
    user.school = req.body.school || null;

    pool.query(`INSERT INTO teacher (teacher_id, name, password, phone, email,` +
        `sex, age) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            user.teacher_id,
            user.name,
            user.pwd,
            user.phone,
            user.email,
            user.sex,
            user.age,
        ],
        (error, results, fields) => {
            if (error) console.error(error);
        });

    res.redirect("/");
});

module.exports = router;

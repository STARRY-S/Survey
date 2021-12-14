"use strict";

const express = require("express");
const session = require("express-session");
const router  = express.Router();
const utils   = require("../utils").utils;
const pool    = require("../utils").pool;

// register page
router.get("/", (req, res) => {
    let user = req.session.user;
    if (res.user) {
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

router.post("/add/student", async (req, res) => {
    let user = req.session.user;
    user.student_id = req.body.student_id;
    user.email = req.body.email || null;
    user.sex = req.body.sex || null;
    user.age = req.body.age || null;
    user.school = req.body.school || null;
    user.profession = req.body.profession || null;
    user.class = req.body.class || null;
    try {
        let hash = await utils.cryptPassword(user.pwd);
        if (!hash) {
            throw("Failed to hash password.");
        }

        pool.query(`INSERT INTO student (student_id, name, password, phone, `
            + ` email, sex, age, profession, class) VALUES `
            + `(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user.student_id,
                user.name,
                hash,
                user.phone,
                user.email,
                user.sex,
                user.age,
                user.profession,
                user.class,
            ], (error, results, fields) => {
                if (error) throw(error);
        });
        req.session.toast = "注册成功";
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).render("error", {errorCode: 500});
    }
});

router.post("/add/teacher", async (req, res) => {
    let user = req.session.user;
    user.teacher_id = req.body.teacher_id;
    user.email = req.body.email || null;
    user.sex = req.body.sex || null;
    user.age = req.body.age || null;
    user.school = req.body.school || null;
    try {
        let hash = await utils.cryptPassword(user.pwd);
        if (!hash) {
            throw("Failed to hash password.");
        }

        pool.query(`INSERT INTO teacher (teacher_id, name, password, phone, ` + 
            ` email, sex, age) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                user.teacher_id,
                user.name,
                hash,
                user.phone,
                user.email,
                user.sex,
                user.age,
            ], (error, results, fields) => {
                if (error) throw(error);
            });
        req.session.toast = "注册成功";
        res.redirect("/");
    } catch(err) {
        console.error(err);
        res.status(500).render("error", {errorCode: 500});
    }
});

module.exports = router;

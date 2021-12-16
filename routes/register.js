"use strict";

const express = require("express");
const router  = express.Router();
const utils   = require("../utils").utils;
const pool    = require("../utils").pool;

// register page
router.get("/", (req, res) => {
    let user = req.session.user;
    if (user) {
        res.redirect("/");
    } else {
        res.render("register/register");
    }
});

router.post("/add", async (req, res) => {
    let user_temp = {
        name: req.body.username,
        pwd:  req.body.password,
        phone: req.body.phone,
        type: req.body.type,
    };

    let result = await utils.sqlQuery(
        `select name from ${user_temp.type} where name=?`
        , [user_temp.name]
    );
    if (result.length > 0) {
        req.session.dialog = {
            action: "register_failed",
        };
        req.session.save(() => {
            res.render("dialog", {
                dialog_obj: {
                    dialog_title: "用户名重复",
                    message: "无法注册，请更换新的用户名后重试！",
                    no_cancel: true,
                }
            });
        });
        return;
    }

    req.session.user_temp = user_temp;
    req.session.save(() => {
        if (user_temp.type === "teacher") {
            res.render("register/teacher");
        } else {
            res.render("register/student");
        }
    });
});

router.post("/add/student", async (req, res) => {
    let user = req.session.user_temp;
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
        req.session.save(() => {
            res.redirect("/");
        });
    } catch (err) {
        console.error(err);
        res.status(500).render("error", {errorCode: 500});
    }
});

router.post("/add/teacher", async (req, res) => {
    let user = req.session.user_temp;
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
        req.session.save(() => {
            res.redirect("/");
        });
    } catch(err) {
        console.error(err);
        res.status(500).render("error", {errorCode: 500});
    }
});

module.exports = router;

"use strict";

const express = require("express");
const session = require("express-session");
const pool    = require("../utils").pool;
const utils   = require("../utils").utils;
const router  = express.Router();

router.get("/", (req, res) => {
    let toast = req.session.toast;
    if (toast) {
        req.session.toast = undefined;
    }
    const title = req.query.title;
    const user = req.session.user;
    if (!user) {
        res.render("login", {
            pageTitle: "请登录",
            surveyName: title,
            toast: toast,
        });
    } else {
        res.redirect("/");
    }
});

router.post("/auth", async (req, res) => {
    const title = req.query.title;
    const name  = req.body.username;
    const pwd   = req.body.password;
    const type  = req.body.type;

    // TODO: login via name or email or phone
    if (name && pwd) {
        let sql = `select id,password from ${type} where (name = ?)`;
        let results = {};
        let match = false;
        try {
            results = await utils.sqlQuery(sql, [name]);
            if (!results || results.length === 0) {
                res.render("login", {
                    pageTitle: "登录失败",
                    errorMessage: "请检查帐号及密码以及用户类型是否正确",
                });
                return;
            }
            match = await utils.comparePassword(pwd, results[0]["password"]);
        } catch (err) {
            console.error(err);
        }

        if (match) {
            let session = req.session;
            const id = results[0].id;
            // create a user object to store username and usertype.
            session["user"] = {
                name: name,
                type: type,
                id: id,
            };
            // console.log("login: ", session.user);
            req.session.save(() => {
                res.redirect(title ? `/?title=${title}` : "/");
            });
        } else {
            res.render("login", {
                pageTitle: "登录失败",
                errorMessage: "请检查帐号及密码以及用户类型是否正确",
            });
        }
    } else {
        res.render("login", {
            pageTitle: "登录失败",
            errorMessage: "请检查帐号及密码以及用户类型是否正确",
        });
    }
});

module.exports = router;

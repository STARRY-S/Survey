"use strict";

const express = require("express");
const session = require("express-session");
const pool    = require("../utils").pool;
const fs      = require("fs");
const router  = express.Router();
const utils   = require("../utils").utils;

router.post("/confirm", (req, res) => {
    const user = req.session.user;

    const dialog = req.session.dialog;
    if (dialog == null) {
        throw new Error("INVALID DIALOG");
    }
    switch (dialog.action) {
        case "delete": {
            if (typeof user === "undefined" || user.type !== "admin") {
                res.status(403).render("error", { errorCode: 403 });
                break;
            }

            const title = dialog.data;
            req.session.dialog = {};

            const sql = `delete from question where title = ?`;
            const filename = "data/" + utils.hashCode(title) + ".json";
            pool.query(sql, [title], (error, results, fields) => {
                if (error) {
                    throw error;
                }
                fs.unlink(filename, (err) => {
                    if (err) {
                        throw error;
                    }
                });
            });
            res.redirect("/");
            break;
        }
        case "add_clear": {
            req.session.dialog = {};
            if (typeof user === "undefined" || user.type !== "admin") {
                res.status(403).render("error", { errorCode: 403 });
                break;
            }

            req.session.obj_list = [];
            req.session.add_user_type;
            res.redirect("/admin/add");
            break;
        }
        default:
            throw new Error("INVALID DIALOG");
    }
});

router.post("/cancel", (req, res) => {
    const dialog = req.session.dialog;
    req.session.dialog = {};
    if (dialog == undefined) {
        res.redirect("/");
        return;
    }

    switch (dialog.action) {
        case "add_clear":
            res.redirect("/admin/add");
            break;
        default:
            res.redirect("/")
    }
});

module.exports = router;

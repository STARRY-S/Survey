"use strict";

const express = require("express");
const session = require("express-session");
const pool    = require("../utils").pool;
const utils   = require("../utils").utils;
const fs      = require("fs");
const path    = require("path");
const router  = express.Router();

const getUserTableName = (type) => {
    switch (type) {
        case "student":
            return "studentdata";
            break;
        case "teacher":
            return "teacherdata";
            break;
        default:
            throw new Error("INVALID USER");
            break;
    }
};

router.post("/", async (req, res) => {
    const loggedin = req.session.loggedin;
    const user     = req.session.user;
    if (!loggedin) {
        res.status(403).render("error", { errorCode: 403 });
        return;
    }

    // console.log(req.session.obj_list);
    let obj_list = req.session.obj_list;
    for (let i = 1; i < obj_list.length; ++i) {
        switch (obj_list[i].type) {
            case "input":
                obj_list[i].answer = req.body[`question_${i}`];
                break;
            case "select":
                obj_list[i].answer = req.body[`question_${i}`];
                break;
            case "multiselect":
                obj_list[i].answer = [];
                for (let j = 1; j <= obj_list[i].q_num; ++j) {
                    if (req.body[`cb_${i}_${j}`]) {
                        obj_list[i].answer.push(obj_list[i].q_list[j-1]);
                    }
                }
                break;
            default:
                break;
        }
    }

    let sql = "select filename from " + getUserTableName(user.type);
    sql += " where (question_id = ? and user_id = ? )";
    try {
        let results = await utils.sqlQuery(sql, [obj_list[0].id, user.id]);
        if (results.length == 0) {
            let sql = `insert into ${getUserTableName(user.type)} (user_id, `
                + `question_id, filename) values ( ?, ?, ? )`;
            const filename = path.join("data", "user",
                    utils.hashCode(user.name + obj_list[0].title) + ".json");
            // console.log("Submit data: ");
            // console.log("user_id: %d\nquestion_id: %d\n", user.id, obj_list[0].id);
            let results = await utils.sqlQuery(sql,
                [user.id, obj_list[0].id, filename]);
            obj_list[0].user = user.id;
            await utils.writeFile(filename, JSON.stringify(obj_list));
            req.session.toast = "提交成功！";
            res.redirect("/");
        } else {
            const filename = results[0].filename;
            obj_list[0].user = user.id;
            await utils.writeFile(filename, JSON.stringify(obj_list));
            req.session.toast = "提交成功！";
            res.redirect("/");
        }
    } catch (err) {
        console.error("Error when submit: \n", err);
        res.status(500).render("error", { errorCode: 500 });
        return;
    }
});

module.exports = router;

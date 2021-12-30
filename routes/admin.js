"use strict";

const express = require("express");
const session = require("express-session");
const fs      = require("fs");
const path    = require("path");
const router  = express.Router();
const pool    = require("../utils").pool;
const utils   = require("../utils").utils;

/**
 * handle get
 */
router.get("/", (req, res) => {
    res.send("admin");
});

const validAdmin = (user) => {
    if (typeof user === "undefined" || user.type !== "admin") {
        return false;
    }
    return true;
}

router.get("/add", (req, res) => {
    const user = req.session.user;

    if (!validAdmin(user)) {
        res.status(403).render("error", { errorCode: 403 });
        return;
    }

    res.render("admin/create_survey", {
        pageTitle: "新建问卷",
        obj_list: req.session.obj_list,
        user_type: req.session.add_user_type,
    });
});

router.get("/edit", async (req, res) => {
    const user = req.session.user;

    if (!validAdmin(user)) {
        res.status(403).render("error", { errorCode: 403 });
        return;
    }

    // render question page if query.edit_title is not undefined
    if (typeof req.query.edit_title !== "undefined") {
        const title = req.query.edit_title;
        let obj_list = [];
        let sql = `select filename,open from question where title = ? `;
        try {
            const results  = await utils.sqlQuery(sql, [title]);
            const filename = results[0].filename;
            const isopen   = results[0].open || false;
            const data     = await utils.readFile(filename);
            obj_list = JSON.parse(data || "[]");
            obj_list[0].isopen = isopen;
        } catch (err) {
            console.error("Error when render question page: \n" + err);
            res.status(500).render("error", {errorCode: 500});
            return;
        }
        res.render("admin/edit", {
            title: title,
            obj_list: obj_list,
        });
        return;
    }

    let sql = `select title from question`;
    try {
        const results = await utils.sqlQuery(sql);
        let question_list = [];
        for (let i = 0; i < results.length; ++i) {
            question_list.push(results[i].title);
        }
        res.render("admin/edit", {
            pageTitle: "查看已发布的问卷",
            question_list: question_list,
        });
    } catch (err) {
        console.error("Error in admin/edit: \n", err);
        res.status(500).render("error", {errorCode: 500});
    }
});

router.get("/review", async (req, res) => {
    const user = req.session.user;

    if (!validAdmin(user)) {
        res.status(403).render("error", { errorCode: 403 });
    }

    const review_qid = req.query.qid;
    if (review_qid) {
        let review_type = req.session.review_type || "student";
        let sql = "select filename from question where id = ?";
        let result = await utils.sqlQuery(sql, [review_qid]);
        let questionFile = result[0].filename;
        let obj_list = JSON.parse(await utils.readFile(questionFile) || "[]");
        // initialize answer list as a array
        for (let i = 1; i < obj_list.length; ++i) {
            if (obj_list[i].type !== "input") {
                for (let p of obj_list[i].q_list) {
                    obj_list[i][`${p}`] = 0;
                }
            } else {
                obj_list[i].answer_list = obj_list[i].answer_list || [];
            }
        }

        sql = "select filename from ";
        sql += (review_type === "student") ? "studentdata" : "teacherdata";
        sql += " where question_id = ?";

        // That"s so horrible :-(
        result = await utils.sqlQuery(sql, [review_qid]);
        for (let i = 0; i < result.length; ++i) {
            let data = JSON.parse(
                await utils.readFile(result[i].filename) || "[]");
            for (let j = 1; j < data.length; ++j) {
                if (data[j].type === "multiselect") {
                    for (let p of data[j].answer) {
                        ++obj_list[j][`${p}`];
                    }
                } else if (data[j].type === "select") {
                    ++obj_list[j][data[j].answer];
                } else if (data[j].type === "input") {
                    obj_list[j].answer_list.push(data[j].answer);
                }
            }
        }
        res.render("admin/review", {
            obj_list: obj_list,
        });
        return;
    }

    const review_data = {
        teacher_num: 0,
        student_num: 0,
    };

    try {
        let sql = "SELECT DISTINCT user_id from teacherdata";
        let results = await utils.sqlQuery(sql);
        review_data.teacher_num = results.length;
        sql = "SELECT DISTINCT user_id from studentdata";
        results = await utils.sqlQuery(sql);
        review_data.student_num = results.length;
        res.render("admin/review", {
            review_data: review_data,
        });
    } catch (err) {
        console.error(err);
        res.status(500).render("error", { errorCode: 500 });
    }
});

router.get("/user_manage", async (req, res) => {
    const user = req.session.user;
    if (!validAdmin(user)) {
        res.status(403).render("error", { errorCode: 403 });
        return;
    }

    let user_data = {};
    let result = await utils.sqlQuery("select count(*) as num from student");
    let student_num = result[0].num;
    result = await utils.sqlQuery("select count(*) as num from teacher");
    let teacher_num = result[0].num;
    result = await utils.sqlQuery("select count(*) as num from studentdata");
    let studentdata_num = result[0].num;
    result = await utils.sqlQuery("select count(*) as num from teacherdata");
    let teacherdata_num = result[0].num;
    user_data["student_num"] = student_num;
    user_data["teacher_num"] = teacher_num;
    user_data["studentdata_num"] = studentdata_num;
    user_data["teacherdata_num"] = teacherdata_num;

    res.render("admin/user_manage.ejs", {
        user_data: user_data,
    });
});

router.get('/import-out', async (req, res) => {
    let user_obj = {};
    user_obj["students"] = [];
    user_obj["teachers"] = [];
    try {
        let result = await utils.sqlQuery("select student_id, register_date, "
            + " name, phone, email, info, age, profession, class, school "
            + " from student");
        for (let i = 0; i < result.length; ++i) {
            user_obj["students"].push({
                student_id: result[i].student_id,
                register_date: result[i].register_date,
                name: result[i].name,
                phone: result[i].phone,
                email: result[i].email,
                info: result[i].info,
                age: result[i].age,
                profession: result[i].profession,
                class: result[i].class,
                school: result[i].school,
            });
        }
        result = await utils.sqlQuery("select teacher_id, register_date, name, "
            + "phone, email, info, sex, age from teacher");
        for (let i = 0; i < result.length; ++i) {
            user_obj["teachers"].push({
                teacher_id: result[i].teacher_id,
                register_date: result[i].register_date,
                name: result[i].name,
                phone: result[i].phone,
                email: result[i].email,
                info: result[i].info,
                age: result[i].age,
                sex: result[i].sex,
            });
        }
        let text = JSON.stringify(user_obj, null, 2);
        res.attachment("output.json");
        res.type('txt');
        res.send(text);
    } catch(err) {
        console.error(err);
        res.render("error", {errorCode:400});
    }
    res.end();
});

/**
 * handle post below
 */
router.post("/add_clear", (req, res) => {
    const user = req.session.user;

    if (!validAdmin(user)) {
        res.status(403).render("error", { errorCode: 403 });
        return;
    }

    const obj = {
        dialog_title: "是否要清空列表？",
        message: `列表中的所有题目都将被删除，此操作无法恢复！`,
        action: "add_clear",
    };

    req.session.dialog = obj;
    res.render("dialog", {
        dialog_obj: obj,
    });
});

router.post("/add_1", (req, res) => {
    const user = req.session.user;

    if (!validAdmin(user)) {
        res.status(403).render("error", { errorCode: 403 });
        return;
    }

    if (typeof req.session.obj_list === "undefined"
        || req.session.obj_list.length < 1)
    {
        const s_title = req.body.s_title;
        let first_obj = {
            title: s_title,
            id: null,
        };

        req.session.obj_list = [];
        req.session.obj_list.push(first_obj);
    }

    let obj = {
        title: req.body.c_title,
        type: req.body.c_type,
    };

    const add_user_type = req.body.user_type;
    req.session.add_user_type = add_user_type;

    req.session.obj_list[0].enable_end_time
                = (req.body.enable_end_time ? true : false);
    if (req.session.obj_list[0].enable_end_time) {
        req.session.obj_list[0].end_time
                = req.body.end_time || "1900-01-01 00:00:00";
    }
    req.session.save();

    if (obj.type !== "input") {
        obj.q_num = req.body.q_num;
        obj.q_list = [];
        res.locals.number = obj.q_num;
        req.session.obj_list.push(obj);
        res.render("admin/add_select", {
            pageTitle: "设置选项",
        });
    } else {
        req.session.obj_list.push(obj);
        res.render("admin/create_survey", {
            pageTitle: "新建问卷",
            obj_list: req.session.obj_list,
            user_type: req.session.add_user_type,
        });
    }
});

router.post("/add_2", (req, res) => {
    const user = req.session.user;

    if (!validAdmin(user)) {
        res.status(403).render("error", { errorCode: 403 });
        return;
    }

    let list = req.session.obj_list;
    if (list.length <= 1) {
        res.status(400).render("error", {
            errorCode: 400,
        });
        return;
    }

    let obj = list[list.length - 1];
    for (let i = 1; i <= obj.q_num; i++) {
        obj.q_list.push(req.body[`select_${i}`]);
    }

    list[list.length - 1] = obj;
    req.session.obj_list = list;
    res.render("admin/create_survey", {
        pageTitle: "新建问卷",
        obj_list: req.session.obj_list,
        user_type: req.session.add_user_type,
    });
});

router.post("/submit", async (req, res) => {
    const user = req.session.user;

    if (!validAdmin(user)) {
        res.status(403).render("error", { errorCode: 403 });
        return;
    }

    const obj_list = req.session.obj_list || [];
    if (obj_list.length <= 1) {
        res.status(400).render("error", {
            errorCode: 400,
        });
        return;
    }
    let type_code = req.session.add_user_type || 0;
    let end_time = obj_list[0].enable_end_time
                ? obj_list[0].end_time : "1900-01-01 00:00:00";

    switch (type_code) {
        case "teacher": type_code = 2; break;
        case "student": type_code = 1; break;
        default: type_code = 0; break;
    }
    obj_list[0].type = type_code;

    if (!fs.existsSync("data")) {
        fs.mkdirSync("data");
    }

    const survey_name = obj_list[0].title || "default";
    const filename = path.join("data", utils.hashCode(survey_name) + ".json");
    let sql = `INSERT INTO question (title, filename, user_type, end_time, `
            + `open) VALUES (?, ?, ?, ?, ?)`;
    let list = [obj_list[0].title, filename, obj_list[0].type, end_time,
        (obj_list[0].enable_end_time) ? 1 : 0];

    try {
        await utils.sqlQuery(sql, list);
        sql = "select id from question where title=?";
        list = [obj_list[0].title];
        const results = await utils.sqlQuery(sql, list);
        obj_list[0].id = results[0].id;
        await utils.writeFile(filename, JSON.stringify(obj_list));
    } catch (err) {
        console.error("Error when saving question: \n" + err);
    }

    req.session.obj_list = [];
    req.session.add_user_type = 0;
    res.redirect("/");
});

router.post("/delete", (req, res) => {
    const user = req.session.user;

    if (!validAdmin(user)) {
        res.status(403).render("error", {errorCode: 403});
        return;
    }

    const title = req.query.edit_title;
    if (title === undefined) {
        res.render("error", {errorCode: 500});
    }

    // store dialog information into user session.
    const obj = {
        dialog_title: "是否要删除此问卷？",
        message: `"${title}" 将被删除，此操作无法恢复！`,
        action: "delete",
        data: `${title}`,
    };

    req.session.dialog = obj;
    res.render("dialog", {
        dialog_obj: obj,
    });
});

router.post("/review", async (req, res) => {
    const user = req.session.user;

    if (!validAdmin(user)) {
        res.status(403).render("error", { errorCode: 403 });
        return;
    }

    const review_type = req.query.type;
    if (!review_type) {
        res.status(403).render("error", { errorCode: 403 });
    }

    let sql = "select distinct question.title,question.id qid from"
    switch (review_type) {
        case "student":
            sql += " question,studentdata where "
                + "studentdata.question_id=question.id"
            break;
        case "teacher":
            sql += " question,teacherdata where "
                + "teacherdata.question_id=question.id"
            break;
        default:
    }

    try {
        let result = await utils.sqlQuery(sql);
        req.session.review_type = review_type;
        res.render("admin/review", {
            question_list: result,
        });
    } catch(err) {
        console.error(err);
        res.status(500).render(error, {errorCode:500});
    }
});

router.post("/open", async (req, res) => {
    const user = req.session.user;

    if (!validAdmin(user)) {
        res.status(403).render("error", { errorCode: 403 });
        return;
    }

    const title = req.query.edit_title;
    if (typeof title === "undefined") {
        res.redirect("/");
        return;
    }

    try {
        let sql = "update question set open = ? where title = ? ";
        await utils.sqlQuery(sql, [ true, title ]);
        // sql = "update question set end_time = '1900-01-01 00:00:00' "
        //     + "where title = ? and end_time < CURRENT_TIMESTAMP()";
        // await utils.sqlQuery(sql, [title]);
        res.render("index", {
            toast: "开启成功",
        });
        return;
    } catch(err) {
        console.log(err);
        res.status(500).render("error", {errorCode: 500});
    }
});

router.post("/close", async (req, res) => {
    const user = req.session.user;

    if (!validAdmin(user)) {
        res.status(403).render("error", { errorCode: 403 });
        return;
    }

    const title = req.query.edit_title;
    if (typeof title === "undefined") {
        res.redirect("/");
        return;
    }

    try {
        let sql = "update question set open = ? where title = ? ";
        await utils.sqlQuery(sql, [ false, title ]);
        res.render("index", {
            toast: "关闭成功",
        });
        return;
    } catch(err) {
        console.log(err);
        res.status(500).render("error", {errorCode: 500});
    }
});

router.post("/import-in", (req, res) => {
    const user = req.session.user;
    if (!validAdmin(user)) {
        res.status(403).render("error", { errorCode: 403 });
        return;
    }
    let sampleFile;
    if (!req.files || Object.keys(req.files).length === 0) {
        res.render('index', { toast: `您没有选择任何文件`});
    } else {
        sampleFile = req.files.sampleFile;
        let uploadPath = "./data/upload/temp_upload_file.json";
        sampleFile.mv(uploadPath, async (err) => {
            if (err) {
                res.render("error", {errorCode: 400});
                console.error(err);
            }
            try {
                let default_password =
                    await utils.cryptPassword("testpassword");
                let content = JSON.parse(await utils.readFile(uploadPath));
                for (let i = 0; i < content["students"].length; ++i) {
                    let result = await utils.sqlQuery("select count(*) as n "
                        + " from student where name=? and student_id=?", [
                            content["students"][i].name,
                            content["students"][i].student_id
                    ]);
                    if (result[0].n > 0) {
                        continue;
                    }
                    await utils.sqlQuery("insert into student "
                        + "(student_id, register_date, name, phone, email, "
                        + "info, age, profession, class, school, password) "
                        + "values (?,?,?,?,?,?,?,?,?,?,?)",
                        [
                            content["students"][i].student_id,
                            content["students"][i].register_date
                                                  .substring(0, 19),
                            content["students"][i].name,
                            content["students"][i].phone,
                            content["students"][i].email,
                            content["students"][i].info,
                            content["students"][i].age,
                            content["students"][i].profession,
                            content["students"][i].class,
                            content["students"][i].school,
                            default_password,
                    ]);
                }
                for (let i = 0; i < content["teachers"].length; ++i) {
                    let result = await utils.sqlQuery("select count(*) as n "
                        + "from teacher where name=? and teacher_id=?", [
                            content["teachers"][i].name,
                            content["teachers"][i].teacher_id
                    ]);
                    if (result[0].n > 0) {
                        continue;
                    }
                    await utils.sqlQuery("insert into teacher "
                        + "(teacher_id, register_date, name, phone, email, "
                        + "info,age,sex,password) values (?,?,?,?,?,?,?,?,?)",
                        [
                            content["teachers"][i].teacher_id,
                            content["teachers"][i].register_date
                                                  .substring(0, 19),
                            content["teachers"][i].name,
                            content["teachers"][i].phone,
                            content["teachers"][i].email,
                            content["teachers"][i].info,
                            content["teachers"][i].age,
                            content["teachers"][i].sex,
                            default_password,
                    ]);
                }
                // console.log(content);
            } catch (err) {
                console.error(err);
                res.render("index", { toast: `${sampleFile.name} 上传失败!`});
            }
            res.render("index", { toast: `${sampleFile.name} 上传成功!`});
        });
    }
});

router.post("/change_admin_password", async (req, res) => {
    const user = req.session.user;
    if (!validAdmin(user)) {
        res.status(403).render("error", { errorCode: 403 });
        return;
    }
    const old_password = req.body.original_password;
    const new_password = req.body.new_password;
    let result = await utils.sqlQuery("select password from admin where name=?",
        [req.session.user.name] );
    if (result.length < 1) {
        res.render("index", {toast: "修改失败，服务器错误"});
        return;
    }
    let valid = await utils.comparePassword(old_password, result[0].password);
    if (!valid) {
        res.render("index", {toast: "修改失败：密码错误"});
        return;
    }
    let encrypted_new_passwd = await utils.cryptPassword(new_password);
    await utils.sqlQuery("update admin set password=? where name=?",
        [encrypted_new_passwd, req.session.user.name]);
    res.render("index", {toast: "密码修改成功"});
});

router.post("/send_mail", async (req, res) => {
    const user = req.session.user;
    let title;
    if (typeof req.query.title !== "undefined" || !validAdmin(user)) {
        title = req.query.title;
    } else {
        res.status(403).render("error", {errorCode:403});
        res.end();
        return;
    }

    let sql = "select user_type from question where title=?";
    let result;
    try {
        result = await utils.sqlQuery(sql, [title]);
    } catch(err) {
        console.error(err);
        res.status(400).render("error", {errorCode:400});
        res.end();
        return;
    }
    if (result.length < 1) {
        res.status(403).render("error", {errorCode:403});
        res.end();
        return;
    }
    let user_type = result[0].user_type;
    if (user_type === 0) {
        // all user
        utils.sendEmailToAll();
    } else if (user_type === 1) {
        // student
        utils.sendEmailToStudent();
    } else if (user_type === 2) {
        // teacher
        utils.sendEmailToTeacher();
    }
    res.render("index", {toast: "发送成功!"});
    res.end();
});

router.post("/change_end_time", async (req, res) => {
    const user = req.session.user;
    let title;
    if (typeof req.query.title !== "undefined" || !validAdmin(user)) {
        title = req.query.title;
    } else {
        res.status(403).render("error", {errorCode:403});
        res.end();
        return;
    }

    let end_time = req.body.end_time || "1900-01-01 00:00:00";
    let sql = "update question set end_time=? where title=?";
    await utils.sqlQuery(sql, [end_time, title]);
    res.render("/", {toast: "修改成功!"});
    res.end();
});

module.exports = router;

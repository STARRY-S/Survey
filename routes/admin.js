const express = require('express');
const session = require('express-session');
const fs 			= require('fs');
const path    = require('path');
const router  = express.Router();
const pool    = require('../utils').pool;
const utils   = require('../utils').utils;

router.get('/', (req, res) => {
	res.send("admin");
});

const validAdmin = (user) => {
	if (typeof user === 'undefined' || user.type !== 'admin') {
		return false;
	}
	return true;
}

router.get('/add', (req, res) => {
	const user = req.session.user;

  if (!validAdmin(user)) {
    res.status(403).render('error', { errorCode: 403 });
    return;
  }

  res.render('admin/create_survey', {
		pageTitle: "新建问卷",
    obj_list: req.session.obj_list,
    user_type: req.session.add_user_type,
	});
});

router.get('/edit', async (req, res) => {
	const user = req.session.user;

	if (!validAdmin(user)) {
		res.status(403).render('error', { errorCode: 403 });
		return;
	}

  // render question page if query.edit_title is not undefined
	if (typeof req.query.edit_title !== 'undefined') {
    const title = req.query.edit_title;
    let obj_list = [];
    let sql = `select filename from question where title = ? `;
    try {
      const results  = await utils.sqlQuery(sql, [ title ]);
      const filename = results[0].filename;
      const data     = await utils.readFile(filename);
      obj_list = JSON.parse(data || '[]');
    } catch (err) {
      console.error("Error when render question page: \n" + err);
      res.status(500).render('error', {errorCode: 500});
      return;
    }
    res.locals.obj_list = obj_list;
    res.render('admin/edit', { title: title });
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
			question_list: question_list
		});
  } catch (err) {
    console.error("Error in admin/edit: \n", err);
    res.status(500).render('error', {errorCode: 500});
  }
});

router.post('/add_clear', (req, res) => {
	const user = req.session.user;

  if (!validAdmin(user)) {
    res.status(403).render('error', { errorCode: 403 });
    return;
  }

  const obj = {
    dialog_title: "是否要清空列表？",
    message: `列表中的所有题目都将被删除，此操作无法恢复！`,
    action: 'add_clear',
  };

  req.session.dialog = obj;
	res.render('dialog', {
    dialog_obj: obj,
  });
});

router.post('/add_1', (req, res) => {
	const user = req.session.user;

  if (!validAdmin(user)) {
    res.status(403).render('error', { errorCode: 403 });
    return;
  }

	const s_title = req.body.s_title;
  const first_obj = {
    title: s_title,
    id: null,
  };
  if (typeof req.session.obj_list === 'undefined'
			|| req.session.obj_list.length < 1) {
    req.session.obj_list = [];
		req.session.obj_list.push(first_obj);
  }

  let obj = {
    title: req.body.c_title,
    type: req.body.c_type,
  };

  const add_user_type = req.body.user_type;
  req.session.add_user_type = add_user_type;

  if (obj.type !== "input") {
    obj.q_num = req.body.q_num;
    obj.q_list = [];
    res.locals.number = obj.q_num;
    req.session.obj_list.push(obj);
    res.render('admin/add_select', {
			pageTitle: "设置选项",
		});
  } else {
    req.session.obj_list.push(obj);
    res.render('admin/create_survey', {
			pageTitle: "新建问卷",
			obj_list: req.session.obj_list,
      user_type: req.session.add_user_type,
		});
  }
});

router.post('/add_2', (req, res) => {
	const user = req.session.user;

  if (!validAdmin(user)) {
    res.status(403).render('error', { errorCode: 403 });
    return;
  }

	let list = req.session.obj_list;
	if (list.length <= 1) {
		res.status(400).render('error', {
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
  res.render('admin/create_survey', {
		pageTitle: "新建问卷",
		obj_list: req.session.obj_list,
    user_type: req.session.add_user_type,
	});
});

router.post('/submit', async (req, res) => {
	const user = req.session.user;

  if (!validAdmin(user)) {
    res.status(403).render('error', { errorCode: 403 });
    return;
  }

	const obj_list = req.session.obj_list;
  let type_code = req.session.add_user_type || 0;


  switch (type_code) {
    case 'teacher': type_code = 2; break;
    case 'student': type_code = 1; break;
    default: type_code = 0; break;
  }
  obj_list[0].type = type_code;

  if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
  }

  const survey_name = obj_list[0].title || 'default';
  const filename = path.join('data', utils.hashCode(survey_name) + '.json');
	let sql = `INSERT INTO question (title, filename, user_type)` +
      ` VALUES (?, ?, ?)`;
  let list = [obj_list[0].title, filename, obj_list[0].type];

  try {
    await utils.sqlQuery(sql, list);
    sql = 'select id from question where title=?';
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

router.post('/delete', (req, res) => {
	const user = req.session.user;

	if (!validAdmin(user)) {
		res.status(403).render('error', {errorCode: 403});
		return;
	}

	const title = req.query.edit_title;
	if (title === undefined) {
		res.render('error', {errorCode: 500});
	}

  // store dialog information into user session.
  const obj = {
    dialog_title: "是否要删除此问卷？",
    message: `"${title}" 将被删除，此操作无法恢复！`,
    action: 'delete',
    data: `${title}`,
  };

  req.session.dialog = obj;
	res.render('dialog', {
    dialog_obj: obj,
  });
});

module.exports = router;

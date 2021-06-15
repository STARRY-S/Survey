const express = require('express');
const session = require('express-session');
const mysql   = require('../database');
const fs 			= require('fs');
const path    = require('path');
const router  = express.Router();
const hashCode= require('../hashcode');

const questionPage = (req, res, title) => {
  if (typeof title === 'undefined' || title == null) {
    title = "*";
  }

  let sql = `select filename from question where title="${title}"`;
  mysql.query(sql, (error, results, fields) => {
    if (error) console.error(error);
    let filename = results[0].filename;

    fs.readFile(filename, (err, data) => {
      const obj_list = JSON.parse(data || "[]");
      res.locals.obj_list = obj_list;
      res.render('admin/edit', {
        title: title,
      });
    });
  });
};

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
	});
});

router.get('/edit', (req, res) => {
	const user = req.session.user;

	if (!validAdmin(user)) {
		res.status(403).render('error', { errorCode: 403 });
		return;
	}

	if (typeof req.query.edit_title !== 'undefined') {
    questionPage(req, res, req.query.edit_title);
    return;
  }

	let sql = `select title from question`;
  mysql.query(sql, (error, results, fields) => {
    if (error) console.error(error);

    let question_list = [];
    for (let i = 0; i < results.length; ++i) {
      question_list.push(results[i].title);
    }
    res.render("admin/edit", {
			title: "查看已发布的问卷",
			question_list: question_list
		});
  });

});

router.post('/add_clear', (req, res) => {
	const user = req.session.user;

  if (!validAdmin(user)) {
    res.status(403).render('error', { errorCode: 403 });
    return;
  }

  req.session.obj_list = [];
  res.render('admin/create_survey', {
		pageTitle: "新建问卷",
	});
});

router.post('/add_1', (req, res) => {
	const user = req.session.user;

  if (!validAdmin(user)) {
    res.status(403).render('error', { errorCode: 403 });
    return;
  }

	let s_title = req.body.s_title;
  if (typeof req.session.obj_list === 'undefined'
			|| req.session.obj_list.length < 1) {
    req.session.obj_list = [];
		req.session.obj_list.push(s_title);
  }      // console.log(obj_list);


  let obj = {
    title: req.body.c_title,
    type: req.body.c_type,
  };

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
	});
});

router.post('/submit', (req, res) => {
	const user = req.session.user;

  if (!validAdmin(user)) {
    res.status(403).render('error', { errorCode: 403 });
    return;
  }

	const obj_list = req.session.obj_list;
	const survey_name = obj_list[0] || 'default';
	const filename = path.join('data', hashCode(survey_name) + '.json');
	const sql = `INSERT INTO question (title, filename) VALUES (?, ?)`;

  try {
    if (!fs.existsSync('data')) {
      fs.mkdirSync('data');
    }

    fs.writeFile(filename, JSON.stringify(obj_list), function (err) {
  	  if (err) console.error(err);

  		mysql.query(sql, [obj_list[0], filename], (error, results, fields) => {
  			if (error) console.error(error);
  			req.session.obj_list = [];
  			res.redirect("/");
  		});
  	});
  } catch (err) {
    console.error(err);
  }

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

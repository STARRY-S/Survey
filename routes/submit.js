const express = require('express');
const session = require('express-session');
const pool    = require('../utils').pool;
const hashCode= require('../utils').utils.hashCode;
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();

const getUserTableName = (type) => {
  switch (type) {
    case 'student':
      return 'studentdata';
      break;
    case 'teacher':
      return 'teacherdata';
      break;
    default:
      throw new Error('INVALID USER');
      break;
  }
};

const getFileSubmittedFilename = (sql, qid) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, [qid], (error, results, fields) => {
      if (error) reject(error);
      if (results.length == 0) {
        resolve(null);
        return;
      }
      resolve(results[0].filename);
    });
  });
};

const storeJsonFile = (user, obj_list) => {
  const filename = path.join('data', 'user',
      hashCode(user.name) + '.json');
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, JSON.stringify(obj_list), (err) => {
      if (err) reject(err);
      resolve(filename);
    });
  });
};

const storeData = (user, qid, filename) => {
  let sql = `insert into ${getUserTableName(user.type)} (user_id, `
    + `question_id, filename) values ( ?, ?, ? )`;

  return new Promise((resolve, reject) => {
    pool.query(sql, [user.id, qid, filename], (err, res, fid) => {
      if (error) reject(error);
      resolve(res);
    });
  });
};

router.post('/', (req, res) => {
  const loggedin = req.session.loggedin;
  const user     = req.session.user;
  if (!loggedin) {
    res.status(403).render('error', { errorCode: 403 });
    return;
  }

  let sql = 'select filename from ' + getUserTableName(user.type);
  sql += ' where question_id = ?';

  // console.log(req.session.obj_list);
  let obj_list = req.session.obj_list;
  for (let i = 1; i < obj_list.length; ++i) {
    // console.log(obj_list[i]);
    switch (obj_list[i].type) {
      case 'input':
        obj_list[i].answer = req.body[`question_${i}`];
        // console.log(req.body[`question_${i}`]);
        break;
      case 'select':
        obj_list[i].answer = req.body[`question_${i}`];
        // console.log(req.body[`question_${i}`]);
        break;
      case 'multiselect':
        obj_list[i].answer = "";
        for (let j = 1; j <= obj_list[i].q_num; ++j) {
          if (req.body[`cb_${i}_${j}`]) {
            obj_list[i].answer += obj_list[i].q_list[j-1] + " ";
          }
        }
        break;
      default:
        break;
    }
  }
  getFileSubmittedFilename(sql, obj_list[0].id)
    .then((filename) => {
      console.log(filename);
    })
    .catch(err => console.error(err));
  console.log(obj_list);
  res.redirect('/');
});

module.exports = router;

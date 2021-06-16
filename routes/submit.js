const express = require('express');
const session = require('express-session');
const pool    = require('../database');
const fs      = require('fs');
const path    = require('path');
const router  = express.Router();

router.post('/', (req, res) => {
  const loggedin = req.session.loggedin;
  const user     = req.session.user;
  if (!loggedin) {
    res.status(403).render('error', { errorCode: 403 });
    return;
  }

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
  console.log(obj_list);
  res.json(obj_list);
});

module.exports = router;

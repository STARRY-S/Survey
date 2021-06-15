const express = require('express');
const session = require('express-session');
const mysql   = require('../database');
const fs 			= require('fs');
const router  = express.Router();
const hashCode= require('../hashcode');

router.post('/confirm', (req, res) => {
  const user = req.session.user;

  const dialog = req.session.dialog;
  if (dialog == null) {
    throw new Error('INVALID DIALOG');
  }
  switch (dialog.action) {
    case 'delete': {
      if (typeof user === 'undefined' || user.type !== 'admin') {
        res.status(403).render('error', { errorCode: 403 });
        break;
      }

      const title = dialog.data;
      req.session.dialog = {};

      const sql = `delete from question where title="${title}"`;
      const filename = 'data/' + hashCode(title) + '.json';
      mysql.query(sql, (error, results, fields) => {
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
    default:
      throw new Error('INVALID DIALOG');
  }
});

router.post('/cancel', (req, res) => {
  req.session.dialog = {};
  res.redirect('/');
});

module.exports = router;

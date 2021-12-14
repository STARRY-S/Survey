"use strict";

const express = require("express");
const session = require("express-session");
const router  = express.Router();

router.get("/", (req, res) => {
    let user = req.session.user;
    if (user) {
        req.session.destroy();
    }
    res.redirect("/login");
});

module.exports = router;

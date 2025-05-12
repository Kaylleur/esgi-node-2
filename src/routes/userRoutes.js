const express = require("express");
const router = express.Router();
const userService = require("../services/userService");

router.post("/", userService.createUser);

module.exports = router;

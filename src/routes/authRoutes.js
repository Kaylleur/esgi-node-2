const express = require("express");
const router = express.Router();
const authService = require("../services/authService");

router.post("/login", authService.login);
router.get("/refresh", authService.refresh);

module.exports = router;

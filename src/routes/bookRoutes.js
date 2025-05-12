const express = require("express");
const router = express.Router();
const bookService = require("../services/bookService");


router.get("/average-price", bookService.averagePriceByAuthor);
router.get("/", bookService.getAll);
router.get("/:id", bookService.getById);
router.post("/", bookService.create);
router.put("/:id", bookService.update);
router.delete("/:id", bookService.remove);

module.exports = router;

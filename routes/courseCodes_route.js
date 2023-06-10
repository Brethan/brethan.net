const express = require("express");
const router = express.Router()
const faJson = require("../public/json/courseCodesFall.json")
const wnJson = require("../public/json/courseCodesWinter.json")

router.get("/:term", (req, res) => {
	const { term } = req.params;
	const selJson = term.toLowerCase().includes("fall") ? faJson : wnJson;

	res.json(selJson)
})

module.exports = router
const express = require("express");
const router = express.Router()


router.get("/", (req, res) => {
	res.render("schedule_request");
})

router.post("/", (req, res) => {
	console.log(req.body);
	res.render("schedule_request");
})
module.exports = router
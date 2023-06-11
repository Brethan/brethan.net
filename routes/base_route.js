const express = require("express");
const { resolve } = require("path")
const router = express.Router()

router.get("/", (req, res) => {
	res.render("index");
})

router.get("/favicon.png", (req, res) => {
	res.sendFile(resolve("./public/images/favicon.png"))
})

router.get("/favicon.ico", (req, res) => {
	res.sendFile(resolve("./public/images/favicon.ico"))
})

router.get("/portal.mp3", (req, res) => {
	res.sendFile(resolve("./public/sound/portal.mp3"))
})

router.get("/schedule_request.js", (req, res) => {
	res.sendFile(resolve("./src/schedule_request.js"))
})

module.exports = router
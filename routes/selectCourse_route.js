const express = require("express");
const { getCourseScheduleData } = require("../functions/scheduleScraper");
const fetch = require("node-fetch").default
const router = express.Router()

router.post("/", async (req, res) => {
	const { courseDepartment, courseNumber, semester } = req.body;
	const year = (semester && semester.toLowerCase().includes("winter")) ? 2024 : 2023;
	
	// TODO: change to fetch from Firestore or Carleton API
	const response = await fetch(`https://api.brethan.net/term/${semester}/${year}/courseCode/${courseDepartment}-${courseNumber}`)
	const json = await response.json()
	if (!json.data || !(json.data instanceof Array))
		return res.status(418).send("Y'dun goofed")
	//
	if (json.data.length == 1 && !json.data[0].crn)
		return res.status(418).send("Y'dun goofered")

	let html = "";
	for (const obj of json.data) {
		html += "<div class=\"outer\"><div class=\"test\">"
		for (const key in obj) {
			if (obj[key] instanceof Object) {
				html += `<div class="wrapper"><div class="text">${key}:</div>`
				html += `<div class="inner"> ${jsonToHtml(obj[key])} </div>`
				html += "</div>"
			} else 
				html += `<div class="text">${key}: ${JSON.stringify(obj[key])}</div>`
		}
		html += "</div></div>"
	}

	res.render("humanread_json", {schedules: html})
})

function jsonToHtml(obj) {
	let html = ""
	for (const key in obj) {
		html += `<div class="text">${key}: ${JSON.stringify(obj[key])}</div>`
	}

	return html;
}

module.exports = router
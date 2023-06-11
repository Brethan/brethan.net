// @ts-check
const express = require("express");
const { getCourseScheduleData } = require("../functions/scheduleScraper");
const router = express.Router()

router.post("/", async (req, res) => {
	const { department, number, semester } = req.body;	
	const year = (semester > 10) ? 2023 : 2024;
	
	const { data, status } = await getCourseScheduleData(department, number, semester, year);
	if (status == 500) {
		return res.status(status).send(data);
		
	} else if (status == 404) {
		return res.status(status).render("redirect")
	}

	let html = "";
	for (const obj of data) {
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
// @ts-check
const express = require("express");
const router = express.Router()
const { CourseScheduleInformation, getCourseScheduleData } = require("../functions/scheduleScraper");
const CourseInfo = require("../schedule_builder/structures/CourseInfo");
const { Collection } = require("@discordjs/collection");
const scheduleBuilder = require("../schedule_builder/scheduleBuilder");


router.get("/", (req, res) => {
	res.render("schedule_request");
})

router.post("/", async (req, res) => {
	const { numberSelect, departmentField, year, term } = req.body;
	const split = term.split("-");

	/** @type {10|20|30} */
	const intTerm = split[0];

	/** @type {string[]} */
	const numbers = (typeof numberSelect == "string") ? [numberSelect] : numberSelect;
	/** @type {string[]} */
	const departments = departmentField.splice(0, numbers.length);
	
	const courseCodes = numbers.map((num, i) => [departments[i].toUpperCase(), num]);
	/** @type {Collection<string, Collection<string, CourseInfo>>} */
	const schedules = new Collection()
	for (const courseCode of courseCodes) {
		const { data, status } = await getCourseScheduleData(courseCode[0], parseInt(courseCode[1]), intTerm, year)
		if (status == 404 || status == 500) continue;
		for (const section of data) {
			if (!schedules.has(section.courseCode)) 
				schedules.set(section.courseCode, new Collection());

			schedules.get(section.courseCode)?.set(section.section, new CourseInfo(section))
		}
	}

	scheduleBuilder(schedules, numbers.length);
	res.render("schedule_request");

})
module.exports = router
// @ts-check
const express = require("express");
const { getCourseScheduleData } = require("../functions/scheduleScraper");
const router = express.Router()

/** @type {Map<string, 10|20|30|undefined>} */
const TERM_NUMBER_MAP = new Map(Object.entries({ "WINTER": 10, "SUMMER": 20, "FALL": 30 }))


router.get("/", (req, res) => {
	res.send("tf you doing here bruv")
})

router.get("/:semester/:year/courseCode/:department-:number", async (req, res) => {
	for (const param in req.params) {
		if (!req.params[param])
			return res.status(400).send("<h1>No thanks</h1>")
	}
	
	const year = parseInt(req.params.year);
	const number = parseInt(req.params.number);
	const semester = req.params.semester.toUpperCase();
	const department = req.params.department.toUpperCase();

	const mappedSem = TERM_NUMBER_MAP.get(semester) || 30;
	const dbCourseRoute = `${semester}${year}/${department}-${number}`;

	const data = await getCourseScheduleData(dbCourseRoute, department, number, mappedSem, year);
	res.status(data.status).send(data.data);
	
})

module.exports = router
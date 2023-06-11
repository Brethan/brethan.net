// @ts-check
const express = require("express");
const { getCourseScheduleData } = require("../functions/scheduleScraper");
const router = express.Router()

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
	const mappedSem = { "WINTER": 10, "SUMMER": 20, "FALL": 30 }[semester] || 30;

	const { data, status } = await getCourseScheduleData(department, number, mappedSem, year);
	res.status(status).send({ data });
	
})

module.exports = router
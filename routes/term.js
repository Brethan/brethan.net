// @ts-check
const express = require("express");
const { getCourseScheduleData } = require("../src/scheduleScraper");
const router = express.Router()

router.get("/", (req, res) => {
	for (const x of ["semester", "year", "department", "number"]) {
		if (!req.query[x])
			return res.json({ status: 404, data: [] });
	}

	const { semester, year, department, number } = req.query;
	return res.redirect(`/term/${semester}/${year}/courseCode/${department}-${number}/${req.query.force ? "force" : ""}`);
})

router.get("/:semester/:year/courseCode/:department-:number", async (req, res) => {
	await serveCourseData(req, res);
})

router.get("/:semester/:year/courseCode/:department-:number/force", async (req, res) => {
	await serveCourseData(req, res, true);	
})


/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {boolean} force 
 */
const serveCourseData = async (req, res, force = false) => {
	const badRequest = () => res.status(404).json({ status: 404, data: [] });
	for (const param in req.params) {
		if (!req.params[param])
			return badRequest();
	}
	
	const thisYear = new Date().getFullYear();
	const year = parseInt(req.params.year);
	const number = parseInt(req.params.number);
	const semester = req.params.semester.toUpperCase();
	const department = req.params.department.toUpperCase();
	const mappedSem = { "WINTER": 10, "SUMMER": 20, "FALL": 30 }[semester] || 30;

	if (year !== thisYear && year !== (thisYear + 1))
		return badRequest();
	if (number < 1000 || number >= 10_000)
		return badRequest();
	if (!department.match(/[a-zA-Z]/))
		return badRequest()

	const { data, status } = await getCourseScheduleData(department, number, mappedSem, year, force);
	res.status(status).send({ status, data });
}

module.exports = router;

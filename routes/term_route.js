const express = require("express");
const getCourseInfo = require("../functions/scheduleScraper");
const router = express.Router()

router.get("/", (req, res) => {
	res.send("tf you doing here bruv")
})

router.get("/:semester/:year/courseCode/:department-:number", async (req, res) => {
	for (const param in req.params) {
		if (!req.params[param])
			return res.status(400).send("<h1>No thanks</h1>")
	}
	
	const { department, number, semester, year } = req.params;
	/** @type {number} */
	let mappedSem;
	switch (semester.toLowerCase()) {
		case "winter":
			mappedSem = 10
			break;
		case "summer":
			mappedSem = 20
			break;
		default: // "FA" or any other weird thing
			mappedSem = 30
			break;
	}

	try { // TODO: Needs to check DB first before adding searching carleton
		const data = await getCourseInfo(department.toUpperCase(), number, mappedSem, year);
		res.json({data: data})
		
	} catch (error) {
		res.status(500).send("<h1>Server Error 500</h1>")
	}
})

module.exports = router
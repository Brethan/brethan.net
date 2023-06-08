require("dotenv").config()
const express = require("express");
const getCourseInfo = require("../functions/scheduleScraper");
const router = express.Router()
const { initializeApp } = require("firebase/app")
const { getFirestore, setDoc, doc, getDoc } = require("firebase/firestore");

const firebaseConfig = {
	apiKey: process.env.API_KEY,
	authDomain: `${process.env.FIREBASE_PROJECT_NAME}.firebaseapp.com`,
	databaseURL: `https://${process.env.FIREBASE_PROJECT_NAME}.firebaseio.com`,
	projectId: `${process.env.FIREBASE_PROJECT_NAME}`,
	storageBucket: `${process.env.FIREBASE_PROJECT_NAME}.appspot.com`,
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp)

router.get("/", (req, res) => {
	res.send("tf you doing here bruv")
})

router.get("/:semester/:year/courseCode/:department-:number", async (req, res) => {
	for (const param in req.params) {
		if (!req.params[param])
			return res.status(400).send("<h1>No thanks</h1>")
	}
	
	const { number, year } = req.params;
	const semester = req.params.semester.toUpperCase();
	const department = req.params.department.toUpperCase();

	/** @type {number} */
	let mappedSem;
	switch (semester) {
		case "WINTER":
			mappedSem = 10
			break;
		case "SUMMER":
			mappedSem = 20
			break;
		default: // "FA" or any other weird thing
			mappedSem = 30
			break;
	}

	const dbCourseRoute = `${semester}${year}/${department}-${number}`;
	console.time("Total Fetch Time")
	try {
		console.time("Cache Check Overhead")
		const cache = await getDoc(doc(db, dbCourseRoute));
		console.timeEnd("Cache Check Overhead")
		//
		let data;
		if (cache.exists()) {
			console.log("cache hit", dbCourseRoute);
			data = cache.data();
		} else {
			// fetch from carleton website
			console.time("Real Fetch Time")
			data = await getCourseInfo(department, number, mappedSem, year);
			if (data[0]?.crn) { // cache the results in the DB
				console.log("cache miss", dbCourseRoute);
				setDoc(doc(db, dbCourseRoute), { data: data })
				.then(() => console.log(`done caching ${dbCourseRoute}\n`))
				.catch(() => console.log(`could not cache ${dbCourseRoute}`));
			}
			console.timeEnd("Real Fetch Time")
			
			data = { data: data };
		}
		
		const status = data.data[0]?.crn ? 200 : 404;
		res.status(status).json(data)
		
	} catch (error) {
		console.log("Something the bad happened.", error);
		res.status(500).send("<h1>Server Error 500</h1>")
	}
	console.timeEnd("Total Fetch Time")
	console.log();
})

module.exports = router
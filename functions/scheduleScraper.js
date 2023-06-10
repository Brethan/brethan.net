const fetch = require("node-fetch");
require("dotenv").config()
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


/**
 * 
 * @param {string} dept 
 * @param {number} code 
 * @param {number} year
 * @param {10 | 20 | 30} semester
 * @returns {Promise<CourseScheduleInformation[]>}
 */
async function getCourseInfo(dept, code, semester = 30, year = 2023) {
	const url = `https://central.carleton.ca/prod/bwysched.p_course_search?wsea_code=EXT&term_code=${year}${semester}`
		+ "&session_id=18370746&ws_numb=&sel_aud=dummy&sel_subj=dummy&sel_camp=dummy&sel_sess=dummy&sel_attr=dummy"
		+ "&sel_levl=dummy&sel_schd=dummy&sel_insm=dummy&sel_link=dummy&sel_wait=dummy&sel_day=dummy&sel_begin_hh=dummy"
		+ "&sel_begin_mi=dummy&sel_begin_am_pm=dummy&sel_end_hh=dummy&sel_end_mi=dummy&sel_end_am_pm=dummy&sel_instruct=dummy"
		+ `&sel_special=dummy&sel_resd=dummy&sel_breadth=dummy&sel_levl=&sel_subj=${dept.toUpperCase()}&sel_number=${code}`
		+ "&sel_crn=&sel_special=N&sel_sess=&sel_schd=&sel_instruct=&sel_begin_hh=0&sel_begin_mi=0&sel_begin_am_pm=a&sel_end_hh="
		+ "0&sel_end_mi=0&sel_end_am_pm=a&sel_day=m&sel_day=t&sel_day=w&sel_day=r&sel_day=f&sel_day=s&sel_day=u&block_button="

	const html = await fetch(url);

	/** @type {string} */
	const text = (await html.text());
	const body = text.substring(text.indexOf("<body>"), text.indexOf("</body>"));
	const lines = body.split("\n");

	const firstEntryIdx = lines.findIndex(str => 
		str.includes("bgcolor=\"#C0C0C0\"") || str.includes("bgcolor=\"#DCDCDC\""))
		
	const upper = lines.slice(firstEntryIdx).filter(str => !str.includes("style="))
	
	const mapped = upper.map(str => (str.match(/>.*?</gi) || [""])
		.filter(str => !str.match(/(><)|(> <)/g))
		.join()
	).filter(arr => arr.length > 0)
		.map(str => str.replace(/<|>|(\&nbsp\;)|,/g, "").trim())
		.filter(str => str != "" && str != "0" && str != ".5")
		.filter(str => !str.match(/(Yes)|(No)/))

	const courses = []
	while (mapped.includes("Open")) {
		mapped.shift()
		const nextOpen = mapped.indexOf("Open");
		const slice = mapped.splice(0, nextOpen)
		if (slice.length) courses.push(slice)
	}

	const lastIndex = mapped.findIndex(str => str.toLowerCase().includes("classes begin on"));
	courses.push(mapped.splice(0, lastIndex + 1))
	
	const courseObjs = [];
	for (const course of courses) {
		const obj = {};
		obj.crn = course[0];
		obj.courseCode = course[1];
		obj.section = course[2];
		obj.courseName = course[3];
		obj.courseType = course[4];
		
		const meetingIdx = course.findIndex(str => str.toLowerCase().includes("meeting date"));
		const alsoRegIdx = course.findIndex(str => str.toLowerCase().includes("also register"));
		const sectionIdx = course.findIndex(str => str.toLowerCase().includes("section information"));
		obj.instructor = (meetingIdx == 5 || alsoRegIdx == 5 || sectionIdx == 5) ? null : course[5];
		obj.meetingInfo = (meetingIdx > -1) ? course[meetingIdx] : null;
		obj.alsoRegister = (alsoRegIdx > -1) ? course[alsoRegIdx] : null;
		obj.sectionInfo = (sectionIdx > -1) ? course[sectionIdx] : null;
		
		courseObjs.push(obj)
	}

	const processAlsoRegister = (course) => {
		if (!course.alsoRegister)
			return;

		let andSections = [];
		let andCourseCode = null;

		/** @type {string} */
		const alsoRegister = course.alsoRegister.substring("Also Register in:".length);

		const split = alsoRegister.split("and")
		
		const parts = split[0].trim().split(" ")
		const courseCode = parts.splice(0, 2).join(" ")
		const sections = parts.filter(str => str.toLowerCase() !== "or");

		if (split.length > 1) {
			const andParts = split[1].trim().split(" ")
			andCourseCode = andParts.splice(0, 2).join(" ")
			andSections = andParts.filter(str => str.toLowerCase() !== "or");
		}

		course.alsoRegister = { 
			courseCode: courseCode, sections: sections,
			andCourseCode: andCourseCode, andSections: andSections
		};
	}

	const processMeetingInfo = (course) => {
		if (!course.meetingInfo)
			return;


		/** @type {string} */
		const meetingInfo = course.meetingInfo;

		const dateEndIdx = meetingInfo.indexOf("Days:")
		const daysEndIdx = meetingInfo.indexOf("Time:", dateEndIdx)
		const timeEndIdx = meetingInfo.indexOf("Building:", daysEndIdx)
		const buildingEndIdx = meetingInfo.indexOf("Room:", timeEndIdx)
		
		course.meetingInfo = {
			"meetingDate": meetingInfo.substring("Meeting Date:".length, dateEndIdx).trim(),
			"days": meetingInfo.substring("Days:".length + dateEndIdx, daysEndIdx).trim(),
			"time": meetingInfo.substring("Time:".length + daysEndIdx, timeEndIdx).trim(),
			"building": meetingInfo.substring("Building:".length + timeEndIdx, buildingEndIdx).trim(),
			"room": meetingInfo.substring("Room:".length + buildingEndIdx).trim()
		}
		
		if (!course.meetingInfo.time.length) {
			course.meetingInfo.startBlock = -1;
			course.meetingInfo.endBlock = -1;
			return
		}

		course.meetingInfo.time = course.meetingInfo.time
			.replace(/(\:35)|(\:25)/g, ":30")
			.replace(":05", ":00")

		const timeSplit = course.meetingInfo.time.split(" - ")
		const timeBlocks = []
		for (let i = 0; i < timeSplit.length; i++) {
			if (timeSplit[i].match(/\d{2}:55/)) {
				const hour = timeToInt(timeSplit[i].split(":")[0], "12").hours + 1; // minute arg doesn't matter
				timeSplit[i] = hour + ":00";
			}
			
			const offset = (60 * 8) + 30;

			const temp = timeSplit[i].split(":");
			const { hours, minutes } = timeToInt(temp[0], temp[1]);

			const block = ((hours * 60 + minutes) - offset) / 30
			timeBlocks.push(block)
		}

		course.meetingInfo.time = timeSplit.join(" - ");
		course.meetingInfo.startBlock = timeBlocks[0];
		course.meetingInfo.endBlock = timeBlocks[1];
	}

	courseObjs.forEach(course => {
		processAlsoRegister(course)
		processMeetingInfo(course)
		if (course.sectionInfo) {
			course.sectionInfo = course.sectionInfo.substring("Section Information: ".length)
		}

	});

	const dummyObj = { "meetingInfo": null, "alsoRegister": null, "sectionInfo": null }
	return courseObjs || [dummyObj];
}

/**
 * @typedef {Object} MeetingTimeInformation
 * @property {string} days
 * @property {string} room
 * @property {string} time
 * @property {string} building
 * @property {string} meetingDate
 * @property {number} startBlock
 * @property {number} endBlock
 */

/**
 * @typedef {Object} AlsoRegisterInformation
 * @property {string[]} sections
 * @property {string[]} andSections
 * @property {string} courseCode
 */

/**
 * @typedef {Object} CourseScheduleInformation
 * @property {string} crn 
 * @property {string} courseCode 
 * @property {string} courseName
 * @property {string} courseType
 * @property {?string} instructor
 * @property {string} section
 * @property {?string} sectionInfo
 * @property {?MeetingTimeInformation} meetingTime
 * @property {?AlsoRegisterInformation} alsoRegister
 */

/**
 * @typedef {Object} ScrapeOutput
 * @property {CourseScheduleInformation[]} data
 */

module.exports.CourseScheduleInformation = this.CourseScheduleInformation
module.exports.ScrapeOutput = this.ScrapeOutput
module.exports.MeetingTimeInformation = this.MeetingTimeInformation
module.exports.AlsoRegisterInformation = this.AlsoRegisterInformation

/**
 * 
 * @param {string} dbCourseRoute 
 * @param {string} department 
 * @param {number} number 
 * @param {10|20|30} semester 
 * @param {number} year 
 * @returns 
 */
async function getCourseScheduleData(dbCourseRoute, department, number, semester, year) {
	try { // TODO: Extract this functionality into a module
		const cache = await getDoc(doc(db, dbCourseRoute));
		//
		let data;
		if (cache.exists()) {
			console.log("cache hit", dbCourseRoute);
			data = cache.data();
		} else {
			// fetch from carleton website
			data = await getCourseInfo(department, number, semester, year);
			if (data[0]?.crn) { // cache the results in the DB
				console.log("cache miss", dbCourseRoute);
				setDoc(doc(db, dbCourseRoute), { data: data })
				.then(() => console.log(`done caching ${dbCourseRoute}\n`))
				.catch(() => console.log(`could not cache ${dbCourseRoute}`));
			} else {
				console.log("fetch miss", dbCourseRoute);
			}
			
			data = { data: data };
		}
		
		const status = data.data[0]?.crn ? 200 : 404;
	
		return { data, status: status };
	} catch (error) {
		return { data: { data: "<h1>Server Error 500</h1>" }, status: 500 }
	}
}

/**
 * 
 * @param {string} hh 
 * @param {string} mm 
 */
function timeToInt(hh, mm) {
	const minute = parseInt((mm.startsWith("0")) ? mm.substring(1) : mm);
	const hour = parseInt((hh.startsWith("0")) ? hh.substring(1) : hh)

	return {minutes: minute, hours: hour}
}

module.exports.getCourseScheduleData = getCourseScheduleData;
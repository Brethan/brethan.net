// @ts-check
const { Axios } = require("axios");
const { CourseScheduleInformation } = require("./types");
/** @type {Axios} */ // @ts-ignore
const axios = require("axios");
require("dotenv").config()
const { initializeApp } = require("firebase/app")
const { getFirestore, setDoc, doc, getDoc, Timestamp } = require("firebase/firestore");

const firebaseConfig = {
	apiKey: process.env.FIREBASE_API_KEY,
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

	const response = (await axios.get(url));	

	/** @type {string} */
	const text = response.data;
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
		const meetingIdx = course.findIndex(str => str.toLowerCase().includes("meeting date"));
		const alsoRegIdx = course.findIndex(str => str.toLowerCase().includes("also register"));
		const sectionIdx = course.findIndex(str => str.toLowerCase().includes("section information"));

		/** @type {CourseScheduleInformation} */
		const obj = {
			crn: course[0],
			courseCode: course[1],
			section: course[2],
			courseName: course[3],
			courseType: course[4],
			instructor: (meetingIdx == 5 || alsoRegIdx == 5 || sectionIdx == 5) ? null : course[5],
			sectionInfo: (sectionIdx > -1) ? course[sectionIdx].replace("Section Information:", "").trim() : null,
			meetingInfo: {
				rawMeetingInfo: (meetingIdx > -1) ? course[meetingIdx] : null,
				days: "",
				startBlock: -1,
				endBlock: -1,
				meetingDate: "",
				time: "",
			},
			alsoRegister: {
				rawAlsoRegister: (alsoRegIdx > -1) ? course[alsoRegIdx] : null,
				courseCode: null,
				andCourseCode: null,
				sections: null,
				andSections: null
			}
		};
		
		
		
		courseObjs.push(obj)
	}

	/** @param {CourseScheduleInformation} course */
	const processAlsoRegister = (course) => {
		if (!course.alsoRegister.rawAlsoRegister)
			return;

		let andSections = [];
		let andCourseCode = "";

		/** @type {string} */
		const alsoRegister = course.alsoRegister.rawAlsoRegister.substring("Also Register in:".length);

		const split = alsoRegister.split("and")
		
		const parts = split[0].trim().split(" ")
		const courseCode = parts.splice(0, 2).join(" ")
		const sections = parts.filter(str => str.toLowerCase() !== "or");

		if (split.length > 1) {
			const andParts = split[1].trim().split(" ")
			andCourseCode = andParts.splice(0, 2).join(" ")
			andSections = andParts.filter(str => str.toLowerCase() !== "or");
		}

		course.alsoRegister.courseCode = courseCode;
		course.alsoRegister.sections = sections;
		course.alsoRegister.andCourseCode = andCourseCode;
		course.alsoRegister.andSections = andSections;
	}

	/** @param {CourseScheduleInformation} course */
	const processMeetingInfo = (course) => {
		if (!course.meetingInfo.rawMeetingInfo)
			return;
		

		// Example - Meeting Date: Sep 04 2024 to Dec 06 2024 Days: Tue Time: 14:35 - 17:25
		const { rawMeetingInfo } = course.meetingInfo;
		const dateEndIdx = rawMeetingInfo.indexOf("Days:")
		const daysEndIdx = rawMeetingInfo.indexOf("Time:", dateEndIdx)

		course.meetingInfo.meetingDate = rawMeetingInfo.substring("Meeting Date:".length, dateEndIdx).trim();
		course.meetingInfo.days = rawMeetingInfo.substring("Days:".length + dateEndIdx, daysEndIdx).trim();
		const time = rawMeetingInfo
			.substring("Time:".length + daysEndIdx)
			.replace(/:\s{0,}[2-3]5/g, ":30")
			.replace(/:\s{0,}05/g, ":00")
			.trim();

		const timeRangeMatch = time.match(/(\d{2}:\d{2})\s-\s(\d{2}:\d{2})/)
		if (!time.length || !timeRangeMatch) {
			return
		}

		const [_, startTime, endTime] = timeRangeMatch;
		const timeRegex = /(\d{1,2})\s{0,}:\s{0,}(\d{2})/;

		/** @type {string} */ // @ts-ignore
		const [_s, startHH, startMM] = startTime.match(timeRegex);
		/** @type {string} */ //@ts-ignore
		const [_e, endHH, endMM] = endTime.match(timeRegex); 
		
		const start = timeToInt(startHH, startMM);
		const end = timeToInt(endHH, endMM);
		if (end.minutes == 55) {
			end.hours++;
			end.minutes = 0;
		}

		const offset = (60 * 8) + 30;
		const startBlock = ((start.hours * 60 + start.minutes) - offset) / 30;
		const endBlock = ((end.hours * 60 + end.minutes) - offset) / 30;

		course.meetingInfo.time = `${startTime} - ${endTime}`;
		course.meetingInfo.startBlock = startBlock;
		course.meetingInfo.endBlock = endBlock;
	}

	courseObjs.forEach(course => {
		processAlsoRegister(course)
		processMeetingInfo(course)
	});

	/** @type {CourseScheduleInformation} */
	const dummyObj = {
		crn: null,
		courseCode: "",
		courseName: "",
		courseType: "",
		instructor: "",
		section: "",
		"meetingInfo": {
			rawMeetingInfo: "",
			days: "",
			startBlock: -1,
			endBlock: -1,
			meetingDate: "",
			time: "",
		},
		"alsoRegister": {
			"rawAlsoRegister": "",
			courseCode: "",
			andCourseCode: "",
			sections: [],
			andSections: []
		},
		"sectionInfo": ""
	}

	return courseObjs || [dummyObj];
}

/**
 * @typedef Temp
 * @property {CourseScheduleInformation[]} data
 * @property {200 | 404 | 500} status
 */

/**
 * @param {string} department 
 * @param {number} number 
 * @param {10|20|30} semester FIXME: Why is this a number
 * @param {number} year 
 * @returns {Promise<Temp>}
 */
async function getCourseScheduleData(department, number, semester, year, force = false) {
	const mappedSem = {"10": "WINTER", "20": "SUMMER", "30": "FALL"}[semester] || "FALL";
	const dbCourseRoute = `${mappedSem}${year}/${department.toUpperCase()}-${number}`;
	const todaySeconds = Date.now() / 1000;
	try {
		const cache = await getDoc(doc(db, dbCourseRoute));
		if (!cache.exists() || force) {
			return await fetchCourseInfo(department, number, semester, year, dbCourseRoute);
		}
		
		console.log("cache hit", dbCourseRoute);
		if (!cache.data().lastFetched) { // lastFetched field does not exist
			console.log("not synced", dbCourseRoute);
			return await fetchCourseInfo(department, number, semester, year, dbCourseRoute);
		}

		const { seconds } = cache.data().lastFetched;
		const daysSinceFetch = Math.ceil((todaySeconds - seconds) / (3600 * 24));
		const threshold = 2; // good enough?
		
		if (daysSinceFetch >= threshold) { // More than {threshold} days since last fetch
			console.log("syncing", dbCourseRoute);
			return await fetchCourseInfo(department, number, semester, year, dbCourseRoute);
		}

		const data = cache.data().data;
		return { data, status: data[0]?.crn ? 200 : 404 };
	} catch (error) {
		console.log(error);
		return { data: [], status: 500 }
	}
}


/**
 * @param {string} department 
 * @param {number} number 
 * @param {10|20|30} semester 
 * @param {number} year 
 * @param {string} dbCourseRoute 
 * @returns {Promise<Temp>}
 */
async function fetchCourseInfo(department, number, semester, year, dbCourseRoute) {
	const data = await getCourseInfo(department, number, semester, year);
	if (!data[0]?.crn) {
		console.log("fetch miss", dbCourseRoute);
		return { data: [], status: 404 };
	}
	
	setDoc(doc(db, dbCourseRoute), { data: data, lastFetched: Timestamp.now() })
			.then(() => console.log(`done caching ${dbCourseRoute}\n`))
			.catch(() => console.log(`could not cache ${dbCourseRoute}`));
		
	return { data, status: 200 };
};

/**
 * 
 * @param {string} hh 
 * @param {string} mm 
 */
function timeToInt(hh, mm) {
	return { minutes: parseInt(mm), hours: parseInt(hh) };
}

module.exports.getCourseScheduleData = getCourseScheduleData;

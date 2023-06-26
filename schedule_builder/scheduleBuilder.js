// @ts-check
const { Collection } = require("@discordjs/collection");
const CourseInfo = require("./structures/CourseInfo");
const CourseGroup = require("./structures/CourseGroup");
const Schedule = require("./structures/Schedule");

/**
 * 
 * @param {Collection<string, Collection<string, CourseInfo>>} courses 
 * @param {number} n
 */
module.exports = async function builder(courses, n) {
	/** @type {CourseGroup[]} */
	const courseGroups = [];
	courses.forEach(course => {
		getPrimarySections(course).forEach(primary => {
			if (!primary.linkedSection)
				return courseGroups.push(new CourseGroup(primary));

			for (const l of primary.linkedSection) {
				const linked = course.find((_, section) => section === l);
				if (!linked) continue;

				if (primary.addSection && primary.addCourse) {
					for (const a of primary.addSection) {
						const added = course.find((_, section) => section = a);
						if (!added) continue;
						if (!linked.conflictsWithAny(primary, added))
							courseGroups.push(new CourseGroup(primary, linked, added));
					}
				}

				if (!linked.conflictsWith(primary) && !primary.addCourse) {
					courseGroups.push(new CourseGroup(primary, linked));
				}
			}
		})
		
	})

	console.log("are you ready?");
	/**
 	 * @param {CourseGroup[]} arr 
 	 */
	const pushSchedule = (arr) => {
		if (!schedules.find(cgg => !CourseGroup.compareScheduleArrays(arr, cgg)))
			return schedules.push(arr);
	}

	const copy = [...courseGroups];
	/** @type {CourseGroup[][]} */
	const sectionGroups = []
	while (copy.length) {
		const first = copy[0];
		const index = copy.findIndex(c => c.primary.courseCode !== first.primary.courseCode)
		const a = copy.splice(0, (index > 0) ? index : copy.length);
		sectionGroups.push(a);
	}

	/** @type {CourseGroup[]} */
	const reducedGroups = [];
	for (const cgArr of sectionGroups) {
		if (cgArr.length < 3) {
			reducedGroups.push(...cgArr)
		} else if (cgArr.length >= 3) {
			const ints = getNRandomInts(Math.min(4, cgArr.length), cgArr.length);
			for (const i of ints) reducedGroups.push(cgArr[i]);
		}
		
	}

	console.log(courseGroups.map(cg => cg.toString()).length);
	console.log(reducedGroups.map(cg => cg.toString()).length)
	
	/**
	 * @type {CourseGroup[][]}
	 */
	const schedules = [];
	// forgive me
	const groups = (courseGroups.length < 25) ? courseGroups : reducedGroups;

	groups.forEach((cg0, _0, col0) => {
		if (n == 1) return pushSchedule([cg0]);

		col0.filter(g => !g.conflictsWith(cg0)).forEach((cg1, _1, col1) => {
			if (n == 2) return schedules.push([cg0, cg1]);

			col1.filter(g => !g.conflictsWith(cg1)).forEach((cg2, _2, col2) => {
				if (n == 3) return pushSchedule([cg0, cg1, cg2])

				col2.filter(g => !g.conflictsWith(cg2)).forEach((cg3, _3, col3) => {
					if (n == 4) return pushSchedule([cg0, cg1, cg2, cg3])

					col3.filter(g => !g.conflictsWith(cg3)).slice(0, 5).forEach((cg4, _4, col4) => {
						if (n == 5) return pushSchedule([cg0, cg1, cg2, cg3, cg4])

						col4.filter(g => !g.conflictsWith(cg4)).forEach((cg5, _5, _col5) => {
							pushSchedule([cg0, cg1, cg2, cg3, cg4, cg5]);
						})
					})
				})
			})
		})
	})

	const numFreeDay = schedules.filter(a => {
		const b = [];
		for (const gc of a) {
			for (const day of gc.days) {
				if (!b.includes(day)) b.push(day)
			}
		}
		
		return b.length < 5;
	})
	
	/** @type {CourseGroup[][]} */
	const unique = []
	for (const sched of schedules) {
		if (!unique.find(cgg => !CourseGroup.compareScheduleArrays(sched, cgg)))
			unique.push(sched);
	}

	console.log(schedules.map(cg => cg.map(c => c.courseSection).sort()))
	console.log(unique.length);
	const a = unique.map(cgArr => new Schedule(...cgArr));
	const test = numFreeDay[0] || schedules[0]
	// a.forEach(sc => console.log(sc.toString()))
}



/**
 * @param {number} n
 * @param {number} max
 * @returns
 */
function getNRandomInts(n, max) {
	const ints = [];
	while (ints.length < n) {
		const ran = getRandomInt(max);
		if (!ints.includes(ran)) ints.push(ran);
	}

	return ints;
}

/**
 * 
 * @param {number} max 
 */
function getRandomInt(max) {
	return Math.floor(Math.random() * max)
}

/**
 * 
 * @param {Collection<string, CourseInfo>} course 
 */
function getPrimarySections(course) {
	return course.filter((_ci, section) => section.length === 1)
}
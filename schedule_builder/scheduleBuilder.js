// @ts-check
const { Collection } = require("@discordjs/collection");
const CourseInfo = require("./structures/CourseInfo");
const CourseGroup = require("./structures/CourseGroup");

/**
 * 
 * @param {Collection<string, Collection<string, CourseInfo>>} courses 
 * @param {number} n
 */
module.exports = function builder(courses, n) {
	/** @type {CourseGroup[]} */
	const courseGroups = [];
	courses.forEach(course => {
		getPrimarySections(course).forEach(primary => {
			if (!primary.linkedSection)
				return courseGroups.push(new CourseGroup(primary));

			for (const l of primary.linkedSection) {
				const linked = course.find((_, section) => section === l);
				if (!linked) continue;

				if (!linked.conflictsWith(primary)) {
					courseGroups.push(new CourseGroup(primary, linked));
				}
			}
		})
		
	})

	/**
 	 * @param {CourseGroup[]} arr 
 	 */
	const pushSchedule = (arr) => {
		if (!schedules.find(cgg => CourseGroup.compareScheduleArrays(arr, cgg)))
			return schedules.push(arr);
	}

	/**
	 * @type {CourseGroup[][]}
	 */
	const schedules = [];
	// forgive me
	courseGroups.forEach((cg0, _, col0) => {
		if (n == 1) return pushSchedule([cg0]);

		col0.filter(g => !g.conflictsWith(cg0)).forEach((cg1, _, col1) => {
			if (n == 2) return pushSchedule([cg0, cg1]);

			col1.filter(g => !g.conflictsWith(cg1)).forEach((cg2, _, col2) => {
				if (n == 4) return pushSchedule([cg0, cg1, cg2])

				col2.filter(g => !g.conflictsWith(cg2)).forEach((cg3, _, col3) => {
					if (n == 4) return pushSchedule([cg0, cg1, cg2, cg3])
					
					col3.filter(g => !g.conflictsWith(cg3)).forEach((cg4, _, col4) => {
						if (n == 5) return pushSchedule([cg0, cg1, cg2, cg3, cg4]);

						col4.filter(g => !g.conflictsWith(cg4)).forEach((cg5, _, _col5) => {
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
	
	/**
	 * @type {CourseGroup[][]}
	 */
	const reduce = []
	schedules.forEach(cg => {
		if (!reduce.find(gc => CourseGroup.compareScheduleArrays(gc, cg)))
			reduce.push(cg);
	})

	console.log(numFreeDay[0]?.map(gc => gc.toString()));
	console.log(reduce.length, schedules.length, numFreeDay.length);
}

/**
 * 
 * @param {CourseGroup[]} stack 
 * @param {CourseGroup[]} select 
 * @param {CourseGroup[]} output 
 */
function buildSchedule(stack, select, output) {

}




/**
 * 
 * @param {Collection<string, CourseInfo>} course 
 */
function getPrimarySections(course) {
	return course.filter((_ci, section) => section.length === 1)
}
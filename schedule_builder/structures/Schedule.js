const CourseGroup = require("./CourseGroup");

module.exports = class Schedule {
	
	static times = ("8:30 9:00 9:30 10:00 10:30 11:00 11:30 12:00 12:30 "
		+ "13:00 13:30 14:00 14:30 15:00 15:30 16:00 16:30 17:00 "
		+ "17:30 18:00 18:30 19:00 19:30 20:00 20:30 21:30 22:00").split(" ");
	static days = "Monday\t Tuesday\t Wednesday Thursday Friday".split(" ").join("\t") + "\n"
		
	
	/**
	 * 
	 * @param  {...CourseGroup} courseGroups 
	 */
	constructor(...courseGroups) {
		this.courseGroups = courseGroups;
	}

	formSchedule() {
		const template = this.makeArray(5, 27, "-")
		for (const group of this.courseGroups) {
			for (const course of group.courses) {
				for (const day of course.meetingDays) {
					if (day == -1) break;
					for (let i = course.startBlock; i < course.endBlock; i++) {
						template[i][day] = course.courseSection;
					}
				}
			}
		}

		return template
	}

	/**
	 * 
	 * @param {number} w 
	 * @param {number} h 
	 * @param {string} val 
	 * @returns {string[][]}
	 */
	makeArray(w, h, val) {
		let arr = [];
		for (let i = 0; i < h; i++) {
			arr[i] = [];
			for (let j = 0; j < w; j++) {
				arr[i][j] = val;
			}
		}

		return arr;
	}


	toString() {
		const template = this.formSchedule().map(arr => arr.map(str => (str == "-") ? "\t\t" : str+"\t"));
		let acc = "\t" + Schedule.days + "\n"
		for (let i = 0; i < template.length; i++) {
			acc += `${Schedule.times[i]}\t${template[i].join("")}\n`;
		}
		
		

		return acc;
	}
}
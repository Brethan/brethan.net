// @ts-check
const { CourseScheduleInformation } = require("../../functions/scheduleScraper");
const { min, max } = Math;

class CourseInfo {
	_days
	/**
	 * 
	 * @param {CourseScheduleInformation} courseInfo 
	 */
	constructor(courseInfo) {
		this.crn = courseInfo.crn
		this.courseCode = courseInfo.courseCode
		this.courseName = courseInfo.courseName
		this.courseType = courseInfo.courseType
		this.instructor = courseInfo.instructor
		this.section = courseInfo.section
		this.meetingInfo = courseInfo.meetingInfo
		this.alsoRegister = courseInfo.alsoRegister
		this.sectionInfo = courseInfo.sectionInfo
		if (this.meetingInfo?.days) {
			this._days = this.meetingInfo.days.toUpperCase().split(" ").map(day => this.daysToInt(day));
		}
	}
	
	/** @readonly */
	get startBlock() {
		return (this.meetingInfo == null) ? -1 : this.meetingInfo.startBlock;
	}

	/** @readonly */
	get endBlock() {
		return (this.meetingInfo == null) ? -1 : this.meetingInfo.endBlock; 
	}

	/** @readonly */
	get meetingDays() {
		return this._days || [-1];
	}

	/** @readonly */
	get linkedCourse() {
		return this.alsoRegister?.courseCode || null;
	}

	/** @readonly */
	get linkedSection() {
		return this.alsoRegister?.sections || null;
	}

	/** @readonly */
	get addCourse() {
		return this.alsoRegister?.andCourseCode || null;
	}

	/** @readonly */
	get addSection() {
		return this.alsoRegister?.andSections || null;
	}

	/** @readonly */
	get courseSection() {
		return this.courseCode + " " + this.section
	}

	/**
	 * 
	 * @param {CourseInfo | null} other 
	 */
	conflictsWith(other) {
		if (!other) return false;
		return (this.overlapsTimeslot(other) && this.sharesDay(other));
	}

	/**
	 * 
	 * @param  {CourseInfo | null} other1
	 * @param  {CourseInfo | null} other2
	 */
	conflictsWithAny(other1, other2) {
		const check1 = this.conflictsWith(other1) && this.conflictsWith(other2);
		const check2 = (other1 && other2) ? other1.conflictsWith(other2) : false;
		return check1 && check2;
	}

	/**
	 * 
	 * @param {CourseInfo} other 
	 */
	overlapsTimeslot(other) {
		return (min(this.endBlock, other.endBlock) - max(this.startBlock, other.startBlock)) > 0
	}

	/**
	 * 
	 * @param {CourseInfo} other 
	 */
	sharesDay(other) {
		return other.meetingDays.filter(day => this.meetingDays.includes(day)).length > 0
	}

	/**
	 * 
	 * @param {string} day 
	 * @returns {-1|0|1|2|3|4}
	 */
	daysToInt(day) {
		const map = {"MON": 0, "TUE": 1, "WED": 2, "THU": 3, "FRI": 4};
		const num = map[day];
		return (num == null) ? -1 : num;
	}
}

module.exports = CourseInfo
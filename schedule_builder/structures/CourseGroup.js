//@ts-check
const CourseInfo = require("./CourseInfo")

module.exports = class CourseGroup {
	/**
	 * 
	 * @param {CourseInfo} primary 
	 * @param {CourseInfo?} secondary 
	 * @param {CourseInfo?} tertiary 
	 */
	constructor(primary, secondary=null, tertiary=null) {
		this.primary = primary
		this.secondary = secondary
		this.tertiary = tertiary
		this.startBlocks = [primary.startBlock];
		this.endBlocks = [primary.endBlock];
		/** @type {Set<number>} */
		this.days = new Set(primary.meetingDays);
		if (secondary) { 
			this.startBlocks.push(secondary.startBlock);
			this.endBlocks.push(secondary.endBlock);
			secondary.meetingDays.forEach(day => this.days.add(day));
		}
		
		if (tertiary) {
			this.startBlocks.push(tertiary.startBlock);
			this.endBlocks.push(tertiary.endBlock);
			tertiary.meetingDays.forEach(day => this.days.add(day));
		}
		
	}

	/** @readonly */
	get primaryCourseCode() {
		return this.primary.courseCode;
	}

	/** @readonly */
	get courseSection() {
		return `${this.primary.courseSection} ${this.secondary?.courseSection || ""}${this.tertiary?.courseSection || ""}` 
	}

	/**
	 * 
	 * @param {CourseGroup} other 
	 */
	conflictsWith(other) {
		const { primary, secondary, tertiary} = this;
		if (this.primaryCourseCode === other.primaryCourseCode)	
			return true;
		if (CourseGroup.courseConflictsWithGroup(primary, other))
			return true;
		if (CourseGroup.courseConflictsWithGroup(secondary, other))
			return true;
		if (CourseGroup.courseConflictsWithGroup(tertiary, other))
			return true;

		return false;
	}

	/**
	 * 
	 * @param {CourseInfo | null} ci 
	 * @param {CourseGroup} other 
	 */
	static courseConflictsWithGroup(ci, other) {
		const { primary, secondary, tertiary} = other;
		if (ci == null) return false;
		return ci.conflictsWith(primary) || ci.conflictsWith(secondary) || ci.conflictsWith(tertiary)
	}

	/**
	 * 
	 * @param {CourseGroup[]} s1 
	 * @param {CourseGroup[]} s2 
	 */
	static compareScheduleArrays(s1, s2) {
		for (const course1 of s1) {
			for (const course2 of s2) {
				if (course1.equals(course2)) {
					return false;
				}
			}
		}

		return true;
	}

	toString() {
		return `Primary ${this.primary.courseSection}; Secondary ${this.secondary?.courseSection}; Tertiary ${this.tertiary?.courseSection}`
	}

	/**
	 * 
	 * @param {CourseGroup} other 
	 */
	equals(other) {
		return this.toString() === other.toString();
	}
}
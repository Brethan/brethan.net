/** 
 * @typedef Instruction
 * @property {string} instructions
 * @property {string} distance
 * @property {string} duration
 * @property {BusInfo} busInfo
 * @property {boolean?} isTransit
 * @property {WalkingStep[]?} walkingSteps
 */

/**
 * @typedef BusInfo
 * @property {string} busId
 * @property {string} vehicleType
 * @property {string} agency
 * @property {string} departsAt
 * @property {string} departsFrom
 * @property {string} arrivesAt
 * @property {string} arrivesTo
 */
/**
 * @typedef WalkingStep
 * @property {string} instructions
 * @property {string} distance
 * @property {string} duration
 */

/**
 * @typedef GeocodedWaypoint
 * @property {"OK" | "ZERO_RESULTS" | "UNKNOWN_ERROR" | "NOT_FOUND" | "INVALID_REQUEST" | "OVER_QUERY_LIMIT" | "REQUEST_DENIED"} geocoder_status
 * @property {string} place_id
 * @property {string[]} types
 * @property {boolean?} partial_match
 */

/**
 * @typedef {Object} MeetingTimeInformation
 * @property {string} days
 * @property {string} time
 * @property {string} meetingDate
 * @property {number} startBlock
 * @property {number} endBlock
 * @property {?string} rawMeetingInfo
 */

/**
 * @typedef {Object} AlsoRegisterInformation
 * @property {?string[]} sections
 * @property {?string[]} andSections
 * @property {?string} courseCode
 * @property {?string} andCourseCode
 * @property {?string} rawAlsoRegister
 */

/**
 * @typedef {Object} CourseScheduleInformation
 * @property {?string} crn 
 * @property {string} courseCode 
 * @property {string} courseName
 * @property {string} courseType
 * @property {string} section
 * @property {?string} instructor
 * @property {?string} sectionInfo
 * @property {MeetingTimeInformation} meetingInfo
 * @property {AlsoRegisterInformation} alsoRegister
 */

module.exports.CourseScheduleInformation = this.CourseScheduleInformation;
module.exports.AlsoRegisterInformation = this.BusInfo;
module.exports.MeetingTimeInformation = this.MeetingTimeInformation;

module.exports.Instruction = this.Instruction;
module.exports.BusInfo = this.BusInfo;
module.exports.WalkingStep = this.WalkingStep;
module.exports.GeocodedWaypoint = this.GeocodedWaypoint;

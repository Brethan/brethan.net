// @ts-check
const { Axios } = require("axios");
const { GeocodedWaypoint, Instruction, WalkingStep } = require("../src/types");

/** @type {Axios} */
// @ts-ignore
const axios = require("axios");
const express = require("express");
const router = express.Router();
require("dotenv").config();

router.get("/directions", async (req, res) => {
	const { origin, destination, transportMethod, transportTime, timeOfOption } = req.query;
	if (!origin || !destination || !transportMethod || !transportTime || !timeOfOption)
		return res.sendStatus(400);

	if (typeof origin !== "string" || typeof destination !== "string"
		|| typeof transportMethod !== "string" || typeof timeOfOption !== "string")
		return res.sendStatus(400);

	const arrivalDeparture = timeOfOption.toLowerCase();
	if (arrivalDeparture !== "arrival" && arrivalDeparture !== "departure")
		return res.sendStatus(400);


	const time = getTransportationTime(transportTime, arrivalDeparture === "departure");
	const apiUrl = `${process.env.MAPS_API}directions/json?origin=${encodeURIComponent(origin)}`
		+ `&destination=${encodeURIComponent(destination)}&key=${process.env.API_KEY}&mode=${transportMethod}`
		+ `&${arrivalDeparture}_time=${time}`;

	let response;
	try {
		response = await axios.get(apiUrl);

		/** @type {Instruction[]} */
		const instructions = response.data.routes[0].legs[0].steps.map(step => {

			/** @type {Instruction} */
			const instruction = {
				instructions: step.html_instructions,
				distance: step.distance.text,
				duration: step.duration.text,
				busInfo: {
					busId: "",
					agency: "",
					vehicleType: "",
					arrivesAt: "",
					arrivesTo: "",
					departsAt: "",
					departsFrom: "",
				},
				isTransit: false,
				walkingSteps: null
			};

			if (step.travel_mode === "TRANSIT" && step.transit_details && step.transit_details.line) {

				instruction.isTransit = true;
				instruction.busInfo.busId = step.transit_details.line.name;
				instruction.busInfo.departsFrom = step.transit_details.departure_stop.name;
				instruction.busInfo.departsAt = step.transit_details.departure_time.text;
				instruction.busInfo.arrivesTo = step.transit_details.arrival_stop.name;
				instruction.busInfo.arrivesAt = step.transit_details.arrival_time.text;
				instruction.busInfo.agency = step.transit_details.line.agencies[0]?.name;
				instruction.busInfo.vehicleType = step.transit_details.line.vehicle?.name

			} else if (step.travel_mode === "WALKING" && step.steps && step.steps.length > 1) {
				/** @type {WalkingStep[]} */
				const walkingSteps = [];
				for (const walkStep of step.steps) {
					walkingSteps.push({
						"instructions": walkStep.html_instructions,
						"distance": walkStep.distance.text,
						"duration": walkStep.duration.text
					});
				}
				instruction.walkingSteps = walkingSteps;
			}

			return instruction;
		});

		/**
		 * @param {string[]} array 
		 * @param {string} cellContent
		 */
		const fillerCells = (array, cellContent) => {
			array.push('<tr class="commute-details">');
			array.push(`<td>${cellContent}</td>`);
			array.push(`<td class="center-cell">--</td>`);
			array.push(`<td class="center-cell">--</td>`);
			array.push("</tr>");
		}

		const html = [];
		for (const obj of instructions) {
			if (obj.walkingSteps || obj.isTransit) {
				html.push(`<tr class="commute-summary ${obj.isTransit ? "transit" : "walk"}">`);
			} else {
				html.push(`<tr>`);
			}

			html.push(`<td>${obj.instructions}</td>`);
			html.push(`<td class="center-cell">${obj.distance}</td>`);
			html.push(`<td class="center-cell">${obj.duration}</td>`);
			html.push("</tr>");
			if (obj.isTransit) {
				const { vehicleType, agency, arrivesAt, arrivesTo, busId, departsAt, departsFrom } = obj.busInfo;
				fillerCells(html, `#${vehicleType} ${busId}% from #${departsFrom}% to #${arrivesTo}%`);
				fillerCells(html, `#${vehicleType} ${busId}% departing from #${departsFrom}% at #${departsAt}%`);
				fillerCells(html, `Exit #${vehicleType}% at stop #${arrivesTo}% at #${arrivesAt}%`);
				fillerCells(html, `#${vehicleType}% dispatched from #${agency}%`);
			} else if (obj.walkingSteps) {
				for (const walkingStep of obj.walkingSteps) {
					html.push('<tr class="commute-details">');
					html.push(`<td>${walkingStep.instructions}</td>`);
					html.push(`<td class="center-cell">${walkingStep.distance}</td>`);
					html.push(`<td class="center-cell">${walkingStep.duration}</td>`);
					html.push("</tr>");

				}
			}
		}

		const formattedHtml = html.map(markup => markup.replace(/\#/g, "<strong>").replace(/\%/g, "</strong>")).join("");
		res.render("directions", {
			instructions: formattedHtml,
			title: origin + " to " + destination
		});
	} catch (error) {
		console.error(error);
		if (!response?.data.geocoded_waypoints)
			return res.sendStatus(500);

		/** @type {GeocodedWaypoint[]} */
		const waypoints = response.data.geocoded_waypoints;
		if (!waypoints.length || waypoints.length !== 2)
			return res.sendStatus(400);

		const params = {
			originInvalid: "",
			destInvalid: ""
		}

		const [origin, destination] = waypoints;
		console.log(waypoints);
		if (origin.geocoder_status !== "OK" || origin.partial_match)
			params.originInvalid = 'class="invalid" placeholder="Please verify address..."';
		if (destination.geocoder_status !== "OK" || destination.partial_match)
			params.destInvalid = 'class="invalid" placeholder="Please verify address..."';


		return res.render("route", params);
	}
});

router.get("/address", async (req, res) => {
	const { lat, lng } = req.query;


	if (!lat || !lng || typeof lat !== "string" || typeof lng !== "string")
		return res.sendStatus(400);

	const latitude = parseFloat(lat);
	const longitude = parseFloat(lng);

	if (isNaN(latitude) || isNaN(longitude))
		return res.sendStatus(400);

	if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180)
		return res.sendStatus(400);

	const apiUrl = `${process.env.MAPS_API}geocode/json?latlng=${latitude},${longitude}&key=${process.env.API_KEY}`;
	const axiResponse = await axios.get(apiUrl);
	if (!axiResponse.data.results || !axiResponse.data.results.length)
		return res.sendStatus(500);

	console.log(longitude, latitude);
	res.json({ "address": axiResponse.data.results[0].formatted_address });
})

router.get("/", (req, res) => {
	res.render("route");
})
/**
 * 
 * @param {string | qs.ParsedQs | string[] | qs.ParsedQs[] } transportTime 
 * @return {"now" | number}
 */
function getTransportationTime(transportTime, departure = false) {
	if (typeof transportTime !== "string")
		return "now";

	const match = transportTime.match(/(\d{1,2}):(\d{2})/)
	if (!match)
		return "now";

	const [_, hh, mm] = match;
	const hours = parseInt(hh);
	const minutes = parseInt(mm);
	if (hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60)
		return "now";

	const timeMillis = new Date().setHours(hours, minutes);

	if (departure && Date.now() > timeMillis)
		return "now";

	return Math.floor(timeMillis / 1000);
}

module.exports = router;

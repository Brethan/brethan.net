//@ts-check
const express = require("express");
const { Axios } = require("axios");

/** @type {Axios} */
// @ts-ignore
const axios = require("axios");
const { join } = require("path");
const { readdirSync } = require("fs");
require("dotenv").config();

const app = express();

app.use(express.static(join(__dirname, "public")));
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
	res.render("index");
});

readdirSync("./routes")
	.filter(file => file.endsWith(".js"))
	.map(file => file.slice(0, file.indexOf(".js")))
	.forEach(route => {
		const router = require(`./routes/${route}`)
		if (!router || router.name !== "router")
			return;
		app.use(`/${route}`, router);
	});

const port = 8080;
app.listen(port, () => console.log(`Listening on port ${port}`));

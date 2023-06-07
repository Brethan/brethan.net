const { readdirSync } = require("fs");
const base = require("./routes/base_route.js")
const express = require("express");
const app = express();

app.set("view engine", "ejs");
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use("/", base);

const routes = readdirSync("./routes")
	.filter(file => file.endsWith("_route.js"))
	.filter(file => !file.startsWith("base"))
	.map(file => file.split("_")[0]);

routes.forEach(route => {
	const router = require(`./routes/${route}_route.js`);
	if (!!router && router.name === "router") {
		app.use(`/${route}`, require(`./routes/${route}_route.js`)) 
	}
})

app.listen(3000)
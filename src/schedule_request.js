let wnJson = null;
let faJson = null;
let first = true;
const datalist = document.getElementById("departments")
const submit = document.getElementById("submit");

document.getElementById("number0").addEventListener("change", toggleButton);

document.getElementsByName("departmentField").forEach(input => input.addEventListener("keyup", async ev => {
	if ((!wnJson || !faJson) && first) {
		first = false;
		const wnRaw = await fetch("https://api.brethan.net/courseCodes/winter");
		const faRaw = await fetch("https://api.brethan.net/courseCodes/fall");
		wnJson = await wnRaw.json();
		faJson = await faRaw.json();
	} else if (!first && (!wnJson || !faJson)) {
		return;
	}

	await new Promise(r => setTimeout(r, 50));
	datalist.innerHTML = "";

	const val = input.value.toUpperCase();
	const potentials = Object.keys(faJson).filter(key => key.startsWith(val));
	/** @type {string}*/
	const srcId = ev.target.id || "uh oh";
	const selId = "number" + srcId.charAt(srcId.length - 1);

	const select = document.getElementById(selId);
	if (potentials.includes(val)) {
		select.disabled = false
		select.innerHTML = "<option>Select ####</option>"
		faJson[val].forEach(str => {
			const option = document.createElement("option");
			option.innerText = str;
			select.appendChild(option);
		})
		
		return;
	} else {
		select.innerHTML = "<option>Select ####</option>";
		toggleButton();
	}
		

	potentials.forEach(dept => {
		const option = document.createElement("option");
		option.value = dept;
		datalist.appendChild(option);
	})
})) 

function toggleButton() {
	const select0 = document.getElementById("number0");
	const selectedText = select0.options[select0.selectedIndex].text;

	if (isNaN(selectedText)) {
		submit.setAttribute("disabled", "true");
	} else {
		submit.removeAttribute("disabled")
	}
}
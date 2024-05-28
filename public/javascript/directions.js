document.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll("tr.commute-summary").forEach(tr => {
		tr.onclick = () => {
			let sibling = tr.nextElementSibling;

			console.log(!!sibling, sibling.tagName === "TR", sibling.classList.contains("commute-details"));
			console.log(sibling.tagName);
			while (sibling && sibling.tagName === "TR" && sibling.classList.contains("commute-details")) {
				if (sibling.classList.contains("active")) {
					sibling.classList.remove("active");
				} else {
					sibling.classList.add("active");
				}

				sibling = sibling.nextElementSibling;				
			}
		}

	})
});

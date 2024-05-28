document.addEventListener("DOMContentLoaded", () => {
	const button = document.getElementById("menu-button");
	const wrapper = document.getElementById("wrapper");
	const mobileMenuClose = document.getElementById("mobile-menu-close");
	const cardflip = document.getElementById("cardflip");
	const portalMusic = document.getElementById("portal");

	const header = document.querySelector("header");
	const largeImg = header.dataset.bg;
	
	let img = new Image();
	img.src = largeImg;
	img.onload = () => {
		header.style.backgroundImage = `url("${largeImg}")`;
	}

	const playAnchor = document.getElementById("play-pause");

	portalMusic.onpause = () => {
		playAnchor.querySelector("span#pause").classList.add("active");
		playAnchor.querySelector("span#play").classList.remove("active");
	}
	
	portalMusic.onplay = () => {
		playAnchor.querySelector("span#play").classList.add("active");
		playAnchor.querySelector("span#pause").classList.remove("active");
		
	}

	playAnchor.onclick = (e) => {
		e.preventDefault()
		if (portalMusic.paused) {
			portalMusic.play();
		} else {
			console.log("bruh");
			portalMusic.pause();
			console.log("bruh paused?");
		}
	}

	
	if (portalMusic.paused) {
		playAnchor.querySelector("span#pause").classList.add("active");
		playAnchor.querySelector("span#play").classList.remove("active");
		document.onclick = () => {
			portalMusic.play();
			document.onclick = () => { };
		}
	} else {
		playAnchor.querySelector("span#play").classList.add("active");
		playAnchor.querySelector("span#pause").classList.remove("active");
	}

	document.querySelectorAll("a").forEach(anchor => {
		const target = document.getElementById(anchor.getAttribute("href").replace(/\#/, ""));
		if (!target)
			return;

		anchor.onclick = (e) => {
			e.preventDefault();
			wrapper.classList.remove(...wrapper.classList)
			document.body.classList.remove(...document.body.classList)
			target.scrollIntoView({ behavior: "smooth" });
		}
	});

	document.querySelectorAll(".blur-load").forEach(div => {
		const img = div.querySelector("img");

		const loaded = () => {
			div.classList.add("loaded");
			div.style.backgroundImage = "";
		}

		if (img.complete) {
			loaded();
		} else {
			img.addEventListener("load", loaded);
		}
	});

	const restartCardflip = () => {
		cardflip.currentTime = 0;
		cardflip.play()
	}

	document.querySelectorAll(".card").forEach(c => {
		// Keep the text for the 
		c.querySelectorAll("p").forEach(p => {
			p.onclick = (e) => {
				e.stopPropagation();
			}
		})

		const removeFlip = () => {
			c.classList.remove("flipped");
			restartCardflip();
			c.querySelector(".card-preview").style.display = "block";
			c.querySelector(".card-content").style.display = "none";
		}



		c.onclick = () => {
			if (c.classList.contains("flipped")) {
				removeFlip();
			} else {
				c.classList.add("flipped");
				restartCardflip();
				c.querySelector(".card-preview").style.display = "none";
				c.querySelector(".card-content").style.display = "block";
			}
		}
	});

	mobileMenuClose.onclick = () => {
		restartCardflip();
		wrapper.classList.add("animated");
	}

	wrapper.onanimationend = () => {
		if (wrapper.classList.contains("animated")) {
			wrapper.classList.remove(...wrapper.classList)
			document.body.classList.remove(...document.body.classList)
		}
	}

	button.onclick = () => {
		restartCardflip()
		wrapper.classList.add("active");
		document.body.classList.add("active")
	}
})

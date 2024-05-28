document.addEventListener("DOMContentLoaded", _ => {
	const getLocationBtn = document.querySelector("#get-my-location");
	const originField = document.querySelector("#origin");
	const transportTimeField = document.querySelector("#transportTime");
	
	const time = new Date().toTimeString();
	const [timeValue] = time.match(/(\d{2}):(\d{2})/);
	transportTimeField.value = timeValue;

	getLocationBtn.onclick = async () => {
		
		navigator.geolocation.getCurrentPosition(async pos => {
			const { latitude, longitude } = pos.coords;

			try {
				const response = await fetch(`/route/address?lng=${longitude}&lat=${latitude}`);

				if (response.ok) {
					const json = await response.json();
					console.log(json.address);
					originField.value = json.address;
				} else
					console.log('bro');
			} catch (error) {
				console.error(error);
			}

		}, error => {
			console.error("Error getting location", error.message);
		}, 
		{ enableHighAccuracy: true }
	);
	}
});

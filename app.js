/** @format */

const apikey = 'e77e1fe5110a5d6b91a7e1d4992df43d';

//Your custom SVG icon mapping
const customiseIcons = {
	Snow: 'images/icon-snow.webp',
	Rain: 'images/icon-rain.webp',
	Thunderstorm: 'images/icon-storm.webp',
	Drizzle: 'images/icon-drizzle.webp',
	Clouds: 'images/icon-overcast.webp',
	Clear: 'images/icon-sunny.webp',
	Fog: 'images/icon-fog.webp',
};

console.log({
	cityName: document.querySelector('.cityName'),
	currentDate: document.getElementById('currentDate'),
	currentTemp: document.getElementById('currentTemp'),
	feelsLike: document.getElementById('feelsLike'),
	humidity: document.getElementById('humidity'),
	wind: document.getElementById('wind'),
	precipitation: document.getElementById('precipation'),
	currentIcon: document.getElementById('currentIcon'),
	forecastContainer: document.getElementById('forecast-container'),
});

//Helper pick icon(fallback = default Openweather icon)
function getIcon(main) {
	if (!main) return 'icons/default.svg';
	//normalize capitalization to match key
	const key = main.charAt(0).toUpperCase() + main.slice(1).toLowerCase();
	return customiseIcons[key] || 'icons/default.svg';
}

async function searchWeather() {
	const city = document.getElementById('search-input').value.trim();
	const errorMsg = document.getElementById('error-msg');
	const container = document.getElementById('weather-container');

	if (!city) {
		errorMsg.textContent = 'Type a city name and press Search!';
		return;
	}

	try {
		errorMsg.textContent = '';
		// 1) Get city coordinates
		const geoRes = await fetch(
			`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apikey}`
		);
		const geoData = await geoRes.json();
		if (!geoData.length) {
			errorMsg.textContent = 'No search result found!';
			container.classList.add('hidden');
			return;
		}

		const { lat, lon, name, country } = geoData[0];

		//2) Get weather data
		const units = 'metric';
		const currentRes = await fetch(
			`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apikey}`
		);
		const current = await currentRes.json();

		//current weather
		const currentMain = current.weather[0].main;
		document.querySelector('.cityName').textContent = `${name}, ${country}`;
		document.getElementById('currentDate').textContent =
			new Date().toLocaleDateString('en-US', {
				weekday: 'long',
				month: 'long',
				day: 'numeric',
				year: 'numeric',
			});
		document.getElementById('currentTemp').textContent = `${Math.round(
			current.main.temp
		)}\u00B0`;
		document.getElementById('feelsLike').textContent = `${Math.round(
			current.main.feels_like
		)}\u00B0`;
		document.getElementById(
			'humidity'
		).textContent = `${current.main.humidity}%`;
		document.getElementById('wind').textContent = `${current.wind.speed} m/s`;
		document.getElementById('precipation').textContent = `${
			current.rain?.['1h'] || 0
		} mm`;

		//Daily Forecast
		const forecastRes = await fetch(
			`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${apikey}`
		);
		const forecastData = await forecastRes.json();

		//group forecast by day (take midday record for each day)
		const dailyMap = {};
		forecastData.list.forEach((entry) => {
			const date = new Date(entry.dt * 1000);
			const day = date.toLocaleDateString('en-US', { weekday: 'short' });
			if (!dailyMap[day] || date.getHours() === 12) {
				dailyMap[day] = entry;
			}
		});

		const dailyContainer = document.getElementById('forecast-container');
		dailyContainer.innerHTML = '';
		Object.values(dailyMap)
			.slice(0, 7)
			.forEach((day) => {
				const date = new Date(day.dt * 1000);
				const main = day.weather[0].main;
				const el = document.createElement('div');
				el.className = 'hermy';
				el.innerHTML = `
        <p class="dailyP">${date.toLocaleDateString('en-US', {
					weekday: 'short',
				})}</p>
        <img src="${getIcon(main)}" alt="${main}" class="dailyImg">
        <p class="daily2p">${Math.round(day.main.temp_max)}\u00B0
        <span class="daily2ps">${Math.round(day.main.temp_min)}\u00B0</span></p>
      `;
				dailyContainer.appendChild(el);
			});

		// Hourly Forecast
		const hourlyRes = await fetch(`
       https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${apikey}`);
		const hourlyData = await hourlyRes.json();

		// container
		const hourlyContainer = document.getElementById('hourly-container');
		hourlyContainer.innerHTML = '';

		// Take first 24 entries (3-hour intervals)
		hourlyData.list.slice(0, 7).forEach((hour) => {
			const date = new Date(hour.dt * 1000);
			const time = date.toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
				hour12: false,
			});

			const main = hour.weather[0].main;
			const temp = Math.round(hour.main.temp);

			const card = document.createElement('div');
			card.className = 'hour-card';
			card.innerHTML = `
      <div class="Firstgroup">
        <p class="hour-time">${time}</p>
        <img src="${getIcon(main)}" alt="${main}" class="hour-icon">
      </div>
   
    <p class="hour-temp">${temp}\u00B0C</p>
  `;
			hourlyContainer.appendChild(card);
		});

		// reveal section
		document.getElementById('hourly-section').classList.remove('hidden');
		container.classList.remove('hidden');
	} catch (error) {
		console.error(error);
		errorMsg.textContent = `Something went wrong!`;
		container.classList.add('hidden');
	}
}

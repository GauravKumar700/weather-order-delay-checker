const API_KEY = process.env.OPENWEATHER_API_KEY;
const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";

export const DELAY_CONDITIONS = ["Rain", "Snow", "Extreme"];

// Step 1: Convert a city name into { lat, lon } using the Geocoding API.
async function geocodeCity(city) {
    const url = `${GEO_URL}?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
    const res = await fetch(url);

    if (!res.ok) {
        throw new Error(`Geocoding request failed (status ${res.status})`);
    }

    const results = await res.json();

    if (!Array.isArray(results) || results.length === 0) {
        throw new Error(`No geocoding match found for city "${city}"`);
    }

    const { lat, lon } = results[0];
    return { lat, lon };
}

// Step 2: Fetch current weather for a given lat/lon.
async function getWeatherByCoords(lat, lon) {
    const url = `${WEATHER_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const res = await fetch(url);

    if (!res.ok) {
        throw new Error(`Weather request failed (status ${res.status})`);
    }

    return res.json();
}

// Fetches current weather for a single order's city
async function fetchWeather(order) {
    try {
        const { lat, lon } = await geocodeCity(order.city);
        const data = await getWeatherByCoords(lat, lon);
        const condition = data.weather?.[0]?.main ?? "Unknown";

        return {
            ...order,
            success: true,
            condition
        };
    } catch (err) {
        console.error(`[ERROR] Could not fetch weather for "${order.city}" (Order ${order.order_id}): ${err.message}`);
        return {
            ...order,
            success: false,
            error: err.message,
        };
    }
}

// Fetches weather for every order CONCURRENTLY.
export async function fetchAllWeather(orders) {
    return Promise.all(orders.map(fetchWeather));
}

export function isDelayCondition(condition) {
    return DELAY_CONDITIONS.includes(condition);
}
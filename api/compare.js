// api/compare.js - Compare multiple cities
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { cities } = req.query; // Comma-separated: "London,Tokyo,Mumbai"
    
    if (!cities) {
        return res.status(400).json({ error: 'Cities required (comma-separated)' });
    }
    
    const cityList = cities.split(',').map(c => c.trim());
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    
    const results = [];
    const errors = [];
    
    // Fetch weather for all cities in parallel
    const promises = cityList.map(async (city) => {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.cod === 200) {
                results.push({
                    city: data.name,
                    country: data.sys.country,
                    temperature: data.main.temp,
                    feels_like: data.main.feels_like,
                    humidity: data.main.humidity,
                    wind_speed: data.wind.speed,
                    conditions: data.weather[0].description,
                    icon: data.weather[0].icon
                });
            } else {
                errors.push({ city, error: data.message });
            }
        } catch (error) {
            errors.push({ city, error: 'Failed to fetch' });
        }
    });
    
    await Promise.all(promises);
    
    res.status(200).json({
        results: results,
        errors: errors,
        count: results.length
    });
}
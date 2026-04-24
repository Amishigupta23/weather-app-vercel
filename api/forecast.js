// api/forecast.js - 5-Day Weather Forecast
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { city } = req.query;
    
    if (!city) {
        return res.status(400).json({ error: 'City name required' });
    }
    
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.cod !== '200') {
            return res.status(404).json({ error: data.message });
        }
        
        // Process forecast data - group by day
        const dailyForecasts = {};
        data.list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = {
                    date: date,
                    temps: [],
                    icons: [],
                    descriptions: []
                };
            }
            dailyForecasts[date].temps.push(item.main.temp);
            dailyForecasts[date].icons.push(item.weather[0].icon);
            dailyForecasts[date].descriptions.push(item.weather[0].description);
        });
        
        // Calculate daily averages
        const forecast = Object.values(dailyForecasts).slice(0, 5).map(day => ({
            date: day.date,
            temp_min: Math.min(...day.temps),
            temp_max: Math.max(...day.temps),
            temp_avg: day.temps.reduce((a, b) => a + b, 0) / day.temps.length,
            description: day.descriptions[Math.floor(day.descriptions.length / 2)],
            icon: day.icons[Math.floor(day.icons.length / 2)]
        }));
        
        res.status(200).json({
            city: city,
            country: data.city.country,
            forecast: forecast
        });
        
    } catch (error) {
        console.error('Forecast error:', error);
        res.status(500).json({ error: 'Failed to fetch forecast' });
    }
}
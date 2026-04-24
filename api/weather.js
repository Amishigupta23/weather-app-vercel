// api/weather.js
// This is a Vercel Serverless Function

export default async function handler(req, res) {
    // Enable CORS for development
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ 
            error: true, 
            message: 'Method not allowed. Please use GET request.' 
        });
    }
    
    // Get city from query parameter
    const { city } = req.query;
    
    // Validate city parameter
    if (!city || city.trim() === '') {
        return res.status(400).json({ 
            error: true, 
            message: 'Please provide a city name. Example: /api/weather?city=London' 
        });
    }
    
    // Get API key from environment variables (set in Vercel dashboard)
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    
    if (!API_KEY) {
        console.error('OPENWEATHER_API_KEY is not set in environment variables');
        return res.status(500).json({ 
            error: true, 
            message: 'Weather service configuration error. Please contact administrator.' 
        });
    }
    
    // Build the OpenWeatherMap API URL
    // Using metric units (Celsius)
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    
    try {
        // Fetch weather data from OpenWeatherMap
        const response = await fetch(url);
        const data = await response.json();
        
        // Handle API errors
        if (data.cod && data.cod !== 200) {
            let errorMessage = 'Could not find weather data for this city.';
            
            if (data.cod === 401) {
                errorMessage = 'Invalid API key configuration.';
            } else if (data.cod === 404) {
                errorMessage = `City "${city}" not found. Please check the spelling and try again.`;
            } else if (data.cod === 429) {
                errorMessage = 'Too many requests. Please try again later.';
            }
            
            return res.status(data.cod === 404 ? 404 : 400).json({
                error: true,
                message: errorMessage,
                code: data.cod
            });
        }
        
        // Format the response for our frontend
        const weatherData = {
            city: data.name,
            country: data.sys.country,
            temperature: data.main.temp,
            feelsLike: data.main.feels_like,
            humidity: data.main.humidity,
            description: data.weather[0].description,
            windSpeed: data.wind.speed,
            unit: 'metric'
        };
        
        // Return successful response
        return res.status(200).json(weatherData);
        
    } catch (error) {
        console.error('Weather API error:', error);
        return res.status(500).json({
            error: true,
            message: 'An unexpected error occurred. Please try again later.'
        });
    }
}
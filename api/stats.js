// api/stats.js - Get search statistics from Redis
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
    const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    const redisHeaders = {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json'
    };
    
    try {
        // Get all history
        const response = await fetch(`${REDIS_URL}/lrange/history/0/-1`, {
            headers: redisHeaders
        });
        const data = await response.json();
        
        let history = [];
        if (data.result) {
            history = data.result.map(item => JSON.parse(item));
        }
        
        // Calculate statistics
        const stats = {
            total_searches: history.length,
            most_searched_city: null,
            avg_temperature: 0,
            searches_by_day: {},
            conditions_count: {}
        };
        
        if (history.length > 0) {
            // Most searched city
            const cityCount = {};
            let totalTemp = 0;
            
            history.forEach(entry => {
                // City count
                cityCount[entry.city] = (cityCount[entry.city] || 0) + 1;
                // Total temperature
                totalTemp += entry.temperature;
                // Searches by day
                const day = entry.timestamp.split('T')[0];
                stats.searches_by_day[day] = (stats.searches_by_day[day] || 0) + 1;
                // Weather conditions
                stats.conditions_count[entry.conditions] = (stats.conditions_count[entry.conditions] || 0) + 1;
            });
            
            stats.most_searched_city = Object.keys(cityCount).reduce((a, b) => 
                cityCount[a] > cityCount[b] ? a : b, null
            );
            stats.avg_temperature = (totalTemp / history.length).toFixed(1);
        }
        
        res.status(200).json(stats);
        
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
}
// api/history.js - Save and retrieve search history using Upstash Redis
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
    
    const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
    const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    const redisHeaders = {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json'
    };
    
    // GET: Retrieve search history
    if (req.method === 'GET') {
        try {
            const response = await fetch(`${REDIS_URL}/lrange/history/0/9`, {
                headers: redisHeaders
            });
            const data = await response.json();
            
            let history = [];
            if (data.result) {
                history = data.result.map(item => JSON.parse(item));
            }
            
            res.status(200).json({ history });
            
        } catch (error) {
            console.error('GET history error:', error);
            res.status(500).json({ error: 'Failed to fetch history' });
        }
    }
    
    // POST: Save a search
    else if (req.method === 'POST') {
        const { city, temperature, conditions } = req.body;
        
        if (!city) {
            return res.status(400).json({ error: 'City required' });
        }
        
        const searchEntry = {
            city,
            temperature: Math.round(temperature),
            conditions,
            timestamp: new Date().toISOString()
        };
        
        try {
            // Add to Redis list (left push)
            await fetch(`${REDIS_URL}/lpush/history/${encodeURIComponent(JSON.stringify(searchEntry))}`, {
                method: 'POST',
                headers: redisHeaders
            });
            
            // Keep only last 10 items
            await fetch(`${REDIS_URL}/ltrim/history/0/9`, {
                method: 'POST',
                headers: redisHeaders
            });
            
            res.status(200).json({ success: true, entry: searchEntry });
            
        } catch (error) {
            console.error('POST history error:', error);
            res.status(500).json({ error: 'Failed to save history' });
        }
    }
    
    // DELETE: Clear history
    else if (req.method === 'DELETE') {
        try {
            await fetch(`${REDIS_URL}/del/history`, {
                method: 'POST',
                headers: redisHeaders
            });
            res.status(200).json({ success: true });
        } catch (error) {
            console.error('DELETE history error:', error);
            res.status(500).json({ error: 'Failed to clear history' });
        }
    }
    
    else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
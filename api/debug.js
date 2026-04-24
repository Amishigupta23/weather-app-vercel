export default function handler(req, res) {
    // This will show us what environment variables exist (but NOT their values for security)
    const hasApiKey = !!process.env.OPENWEATHER_API_KEY;
    const keyLength = process.env.OPENWEATHER_API_KEY ? process.env.OPENWEATHER_API_KEY.length : 0;
    
    res.status(200).json({
        hasApiKey: hasApiKey,
        keyLength: keyLength,
        message: hasApiKey ? "API key is configured!" : "API key is MISSING",
        tip: "If key is missing, redeploy your app after setting env vars"
    });
}
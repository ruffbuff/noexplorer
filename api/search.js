// Vercel API function to proxy MWMBL search requests
// This avoids CORS issues in production

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    res.status(400).json({ error: 'Query parameter "q" is required' });
    return;
  }

  try {
    console.log(`[API] Proxying search request for: "${q}"`);

    // Try MWMBL endpoints
    const endpoints = [
      `https://api.mwmbl.org/search?s=${encodeURIComponent(q)}`,
      `https://mwmbl.org/api/v1/search/?s=${encodeURIComponent(q)}`,
    ];

    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`[API] Trying endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Noexplorer/1.0 (Privacy-focused search engine)',
          },
          // Add timeout
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log(`[API] Success! Got ${Array.isArray(data) ? data.length : 'unknown'} results`);
        
        // Return successful response
        res.status(200).json({
          success: true,
          results: data,
          source: 'mwmbl',
          query: q,
          timestamp: new Date().toISOString(),
        });
        return;

      } catch (endpointError) {
        console.error(`[API] Endpoint ${endpoint} failed:`, endpointError.message);
        lastError = endpointError;
        continue;
      }
    }

    // All endpoints failed
    console.error(`[API] All search endpoints failed for query: "${q}"`);
    res.status(503).json({
      success: false,
      error: 'Search service unavailable',
      message: lastError?.message || 'All search endpoints failed',
      query: q,
    });

  } catch (error) {
    console.error('[API] Unexpected error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      query: q,
    });
  }
}
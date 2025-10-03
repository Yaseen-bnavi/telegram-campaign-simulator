const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const store = getStore('leaderboard');

    // SUBMIT SCORE - POST request
    if (event.httpMethod === 'POST') {
      const { user_id, display_name, score, tci, tap_power, cards_count } = JSON.parse(event.body);
      
      console.log('Submitting score for:', display_name, 'Score:', score);
      
      await store.setJSON(user_id, {
        display_name: display_name,
        score: score || 0,
        tci: tci || 0,
        tap_power: tap_power || 0,
        cards_count: cards_count || 0,
        last_updated: new Date().toISOString()
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Score submitted to global leaderboard!' })
      };
    }

    // GET LEADERBOARD - GET request
    if (event.httpMethod === 'GET') {
      console.log('Fetching global leaderboard...');
      
      const { list } = await store.list();
      const scores = [];

      for (const item of list) {
        const userData = await store.getJSON(item.key);
        if (userData) {
          scores.push({
            user_id: item.key,
            display_name: userData.display_name,
            score: userData.score || 0,
            tci: userData.tci || 0,
            tap_power: userData.tap_power || 0,
            cards_count: userData.cards_count || 0,
            last_updated: userData.last_updated
          });
        }
      }

      // Sort by score (highest first)
      scores.sort((a, b) => (b.score || 0) - (a.score || 0));
      const topScores = scores.slice(0, 100);

      console.log(`Returning ${topScores.length} global scores`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(topScores)
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };

  } catch (error) {
    console.error('Leaderboard error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { endpoint, payload } = JSON.parse(event.body);
    const NOTION_TOKEN = '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';

    const resp = await fetch('https://api.notion.com/v1/' + endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
        'Authorization': 'Bearer ' + NOTION_TOKEN
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();
    return {
      statusCode: resp.status,
      headers,
      body: JSON.stringify(data)
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e.message })
    };
  }
};

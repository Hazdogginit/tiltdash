// Shopify Admin API proxy
// Set these in Netlify → Site Settings → Environment Variables:
//   SHOPIFY_SHOP_DOMAIN  e.g. your-store.myshopify.com
//   SHOPIFY_ACCESS_TOKEN e.g. shpat_xxxxxxxxxxxx (Admin API access token)

const API_VERSION = '2024-01';

const RESOURCES = {
  orders:   `/admin/api/${API_VERSION}/orders.json?status=any&limit=50&fields=id,name,created_at,financial_status,total_price,line_items,customer`,
  products: `/admin/api/${API_VERSION}/products.json?limit=50&fields=id,title,variants,status`,
  shop:     `/admin/api/${API_VERSION}/shop.json`,
  count:    `/admin/api/${API_VERSION}/orders/count.json?status=any`,
};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const shop  = process.env.SHOPIFY_SHOP_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!shop || !token) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ error: 'Shopify not configured. Add SHOPIFY_SHOP_DOMAIN and SHOPIFY_ACCESS_TOKEN to Netlify environment variables.' }),
    };
  }

  const resource = (event.queryStringParameters || {}).resource || 'orders';
  const path = RESOURCES[resource];

  if (!path) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: `Unknown resource: ${resource}` }) };
  }

  try {
    const resp = await fetch(`https://${shop}${path}`, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      return { statusCode: resp.status, headers, body: JSON.stringify({ error: text }) };
    }

    const data = await resp.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

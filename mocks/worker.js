// Deploy this ts as a Cloudflare worker

// The configuration object now uses native JavaScript objects for better clarity.
const pathConfig = {
  '/admin/service/registration/validateDevice': {
    cacheExpirationDays: 3650,
    message: 'Device Valid',
    resultCode: 'GOOD',
  },
  '/admin/service/registration/validate': {
    featId: '',
    registered: true,
    expDate: '2099-01-01',
    key: '',
  },
  '/admin/service/registration/getStatus': {
    deviceStatus: '',
    planType: 'Lifetime',
    subscriptions: {},
  },
  '/admin/service/appstore/register': {
    featId: '',
    registered: true,
    expDate: '2099-01-01',
    key: '',
  },
  '/emby/Plugins/SecurityInfo': {
    SupporterKey: "",
    IsMBSupporter: true,
};

// Common CORS response headers.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * Helper function to create a standard JSON response.
 * @param {object} body - The JavaScript object to send.
 * @param {number} status - The HTTP status code.
 * @returns {Response}
 */
const createJsonResponse = (body, status) => {
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
  };
  return new Response(JSON.stringify(body), { status, headers });
};

// Main Worker logic.
export default {
  async fetch(request) {
    // Return preflight requests directly, no body needed.
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const { pathname } = new URL(request.url);
    const body = pathConfig[pathname];

    // Core logic: return 200 if the config is found, otherwise return 404.
    if (body) {
      return createJsonResponse(body, 200);
    } else {
      const notFoundBody = {
        resultCode: "ERROR",
        message: `Endpoint not found for path: ${pathname}`,
      };
      return createJsonResponse(notFoundBody, 404);
    }
  },
};

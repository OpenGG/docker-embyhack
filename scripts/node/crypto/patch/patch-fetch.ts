
/**
 * ### FETCH OVERRIDE ###
 * Intercepts specific API calls to the Emby server to provide a mock response,
 * effectively bypassing registration checks.
 */
const originalFetch = window.fetch;

// Defines the shape of the mock API responses.
const mockApiEndpoints: Record<string, unknown> = {
  '/admin/service/registration/validateDevice': ({
    cacheExpirationDays: 3650,
    message: "Device Valid",
    resultCode: "GOOD"
  }),
  '/admin/service/registration/validate': ({
    featId: "",
    registered: true,
    expDate: "2099-01-01",
    key: ""
  }),
  '/admin/service/registration/getStatus': ({
    deviceStatus: "",
    planType: "",
    subscriptions: {}
  }),
};

/**
 * Creates a mock Response object.
 * @param data The stringified JSON data to return.
 * @returns A Promise that resolves with a mock Response.
 */
const createMockResponse = (data: unknown): Promise<unknown> => Promise.resolve({
  status: 200,
  text: () => JSON.stringify(data),
  json: () => data,
});

/**
 * Overridden window.fetch function.
 * It checks if the request URL matches a mocked endpoint and returns the mock response.
 * Otherwise, it proceeds with the original fetch request.
 */
(window as unknown as any).fetch = function (): Promise<unknown> {
  try {
    const url = arguments[0];
    if (typeof url === 'string') {
      var keys = Object.keys(mockApiEndpoints);
      for (var i = 0; i < keys.length; i++) {
        var p = keys[i];
        if (url.includes(p)) {
          var data = mockApiEndpoints[p];
          return createMockResponse(data);
        }
      }
    }
  } catch (e: unknown) {
    console.error('Mock fetch failed', e)
    // fall back to originalFetch
  }

  return originalFetch.apply(this, arguments);
};

const API_BASE_URL = "/api";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("certiverify_token");
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // If body is not FormData, set Content-Type to application/json
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    login: (identifier, password) =>
      request("/auth/login", {
        method: "POST",
        body: { identifier, password },
      }),
    getMe: () => request("/auth/me"),
    updateWallet: (walletAddress) =>
      request("/auth/wallet", {
        method: "POST",
        body: { walletAddress },
      }),
  },

  certificates: {
    verify: (formDataOrBody) => {
      if (formDataOrBody instanceof FormData) {
        return request("/certificates/verify", {
          method: "POST",
          body: formDataOrBody,
        });
      }
      return request("/certificates/verify", {
        method: "POST",
        body: formDataOrBody,
      });
    },

    register: (formData) =>
      request("/certificates/register", {
        method: "POST",
        body: formData,
      }),

    getAll: (params = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          searchParams.append(key, val);
        }
      });
      const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
      return request(`/certificates${query}`);
    },

    getById: (id) => request(`/certificates/${id}`),

    revoke: (id, data) =>
      request(`/certificates/${id}/revoke`, {
        method: "POST",
        body: data,
      }),
  },

  dashboard: {
    getStats: () => request("/dashboard/stats"),
  },

  blockchain: {
    getStatus: () => request("/blockchain/status"),
    getAbi: () => request("/blockchain/contract-abi"),
  },
};


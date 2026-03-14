// Central API client for CoreInventory
// Reads the backend URL from Vite environment variable VITE_API_URL
// Falls back to localhost:8000 for local development

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default API_BASE;

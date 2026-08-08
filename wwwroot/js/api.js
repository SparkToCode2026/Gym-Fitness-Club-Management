const API_BASE = "https://localhost:7130";

function getToken()  { return localStorage.getItem("token"); }
function setToken(t) { localStorage.setItem("token", t); }
function clearToken(){ localStorage.removeItem("token"); }

async function api(path, method = "GET", body = null) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  if (res.status === 401) { clearToken(); location.href = "/login.html"; return; }

  const text = await res.text();
  const data = text ? tryParse(text) : null;

  if (!res.ok) throw new Error(data?.title || data || res.statusText);
  return data;
}

function tryParse(t) { try { return JSON.parse(t); } catch { return t; } }

function requireAuth() {
  if (!getToken()) {
    location.href = "/login.html";
  }
}
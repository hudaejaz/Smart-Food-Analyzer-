/**
 * api.js — Centralized API service for EatologyApp
 *
 * All methods receive `baseUrl` (from AppContext) so every call dynamically
 * uses whatever the user configured, with no hardcoded host anywhere.
 *
 * Auth token is also passed in from context where required.
 */

// ─── Generic helper ───────────────────────────────────────────────────────────

async function request(baseUrl, path, options = {}) {
  const url = `${baseUrl}${path}`;
  const { headers: extraHeaders, ...restOptions } = options;
  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...extraHeaders,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      const message = data?.detail || data?.message || `HTTP ${response.status}`;
      throw new Error(message);
    }
    return data;
  } catch (err) {
    if (err.message.startsWith('HTTP ') || err instanceof SyntaxError) throw err;
    throw new Error(err.message || 'Network error — check your API URL and connection.');
  }
}

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Auth APIs ─────────────────────────────────────────────────────────────────
// POST /auth/register
export async function registerUser(baseUrl, { name, email, password, date_of_birth, gender, height_cm, weight_kg, disease = 'none' }) {
  return request(baseUrl, '/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, date_of_birth, gender, height_cm, weight_kg, disease }),
  });
}

// POST /auth/login
export async function loginUser(baseUrl, { email, password }) {
  return request(baseUrl, '/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// GET /auth/me
export async function getMe(baseUrl, token) {
  return request(baseUrl, '/auth/me', {
    headers: authHeader(token),
  });
}

// ─── User Goals APIs ───────────────────────────────────────────────────────────
// GET /goals
export async function getUserGoals(baseUrl, token) {
  return request(baseUrl, '/goals', {
    headers: authHeader(token),
  });
}

// PUT /goals
export async function updateUserGoals(baseUrl, token, goalsPayload) {
  return request(baseUrl, '/goals', {
    method: 'PUT',
    headers: authHeader(token),
    body: JSON.stringify(goalsPayload),
  });
}

// ─── Meal Log APIs ─────────────────────────────────────────────────────────────
// POST /log
export async function logMeal(baseUrl, token, mealPayload) {
  return request(baseUrl, '/meals/log', {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify(mealPayload),
  });
}

// GET /history
export async function getMealHistory(baseUrl, token) {
  return request(baseUrl, '/meals/history', {
    headers: authHeader(token),
  });
}

// GET /daily-summary
export async function getDailySummary(baseUrl, token) {
  return request(baseUrl, '/meals/daily-summary', {
    headers: authHeader(token),
  });
}

// ─── Food Analysis APIs ────────────────────────────────────────────────────────
// POST /food/analyze  (multipart/form-data)
export async function analyzeFood(baseUrl, token, { imageUri, bbox_x = 315, bbox_y = 505, bbox_w = 5, bbox_h = 8, camera_height_cm = 30.0 }) {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'capture.jpg',
  });
  formData.append('bbox_x', String(bbox_x));
  formData.append('bbox_y', String(bbox_y));
  formData.append('bbox_w', String(bbox_w));
  formData.append('bbox_h', String(bbox_h));
  formData.append('camera_height_cm', String(camera_height_cm));

  const url = `${baseUrl}/food/analyze`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json', 'ngrok-skip-browser-warning': 'true', ...authHeader(token) },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.detail || `HTTP ${response.status}`);
  return data; // { task_id }
}

// GET /food/result/:task_id  — poll until done or failed
export async function getFoodResult(baseUrl, task_id) {
  return request(baseUrl, `/food/result/${task_id}`);
}

/**
 * pollFoodResult — keeps calling getFoodResult every `intervalMs` ms
 * until status is "done" or "failed", or until `maxAttempts` is reached.
 * Defaults are tuned for ngrok's 40-second tunnel timeout:
 *   3 s × 13 attempts = 39 s max wait (just under the 40 s ngrok limit).
 */
export async function pollFoodResult(baseUrl, task_id, { intervalMs = 3000, maxAttempts = 13 } = {}) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    const result = await getFoodResult(baseUrl, task_id);
    if (result.status === 'done' || result.status === 'failed') return result;
  }
  throw new Error('Analysis timed out. Please try again.');
}

// ─── Depth Validation API ──────────────────────────────────────────────────────
// POST /depth/validate  (multipart/form-data)
export async function validateDepth(baseUrl, { imageUri, x = 315, y = 505, w = 5, h = 8 }) {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'frame.jpg',
  });
  formData.append('x', String(x));
  formData.append('y', String(y));
  formData.append('w', String(w));
  formData.append('h', String(h));

  const url = `${baseUrl}/depth/validate`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json', 'ngrok-skip-browser-warning': 'true' },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.detail || `HTTP ${response.status}`);
  return data; // { status, depth_score, color, message }
}

// ─── Nutrition Search APIs ─────────────────────────────────────────────────────
// GET /nutrition/foods?q=...
export async function searchFoods(baseUrl, token, query, limit = 10) {
  return request(baseUrl, `/nutrition/foods?q=${encodeURIComponent(query)}&limit=${limit}`, {
    headers: authHeader(token),
  });
}

// GET /nutrition/foods/:food_id
export async function getFoodById(baseUrl, token, food_id) {
  return request(baseUrl, `/nutrition/foods/${food_id}`, {
    headers: authHeader(token),
  });
}
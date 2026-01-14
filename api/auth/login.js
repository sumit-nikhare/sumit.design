const bcrypt = require("bcryptjs");
const { sql } = require("@vercel/postgres");
const { readJson, sendJson } = require("../_utils");
const { setAuthCookie } = require("../_auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  let body;
  try {
    body = await readJson(req);
  } catch {
    return sendJson(res, 400, { error: "Invalid JSON" });
  }

  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  if (!username || !password) {
    return sendJson(res, 400, { error: "Username and password required." });
  }

  const usernameLower = username.toLowerCase();
  const found = await sql`
    SELECT id, username, password_hash
    FROM users
    WHERE username_lower = ${usernameLower}
  `;

  if (!found.rows.length) {
    return sendJson(res, 401, { error: "Invalid username or password." });
  }

  const user = found.rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return sendJson(res, 401, { error: "Invalid username or password." });
  }

  setAuthCookie(res, user);
  return sendJson(res, 200, { username: user.username });
};

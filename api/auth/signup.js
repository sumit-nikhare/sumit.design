const bcrypt = require("bcryptjs");
const { sql } = require("@vercel/postgres");
const { readJson, sendJson } = require("../_utils");
const { setAuthCookie } = require("../_auth");

const USERNAME_RE = /^[a-zA-Z0-9._-]{3,32}$/;

const DEFAULT_UI = {
  showCompleted: true,
  filterMode: "all",
  sortMode: "created",
  searchQuery: ""
};

function defaultData() {
  return {
    version: 1,
    tasks: [],
    jobs: [],
    ui: { tasks: { ...DEFAULT_UI }, jobs: { ...DEFAULT_UI } },
    seq: { task: 0, job: 0 }
  };
}

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

  if (!USERNAME_RE.test(username)) {
    return sendJson(res, 400, { error: "Username must be 3-32 chars (letters, numbers, . _ -)." });
  }

  if (password.length < 8) {
    return sendJson(res, 400, { error: "Password must be at least 8 characters." });
  }

  const usernameLower = username.toLowerCase();

  const existing = await sql`SELECT id FROM users WHERE username_lower = ${usernameLower}`;
  if (existing.rows.length) {
    return sendJson(res, 409, { error: "Username already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await sql`
    INSERT INTO users (username, username_lower, password_hash)
    VALUES (${username}, ${usernameLower}, ${passwordHash})
    RETURNING id, username
  `;

  const user = created.rows[0];
  await sql`
    INSERT INTO user_data (user_id, data)
    VALUES (${user.id}, ${JSON.stringify(defaultData())}::jsonb)
    ON CONFLICT (user_id) DO NOTHING
  `;

  setAuthCookie(res, user);
  return sendJson(res, 200, { username: user.username });
};

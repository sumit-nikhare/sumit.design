const { sql } = require("@vercel/postgres");
const { sendJson, readJson } = require("./_utils");
const { getAuth } = require("./_auth");

const DEFAULT_UI = {
  showCompleted: true,
  filterMode: "all",
  sortMode: "created",
  searchQuery: ""
};

function normalizeUi(ui) {
  return { ...DEFAULT_UI, ...(ui && typeof ui === "object" ? ui : {}) };
}

function defaultData() {
  return {
    version: 1,
    tasks: [],
    jobs: [],
    ui: { tasks: { ...DEFAULT_UI }, jobs: { ...DEFAULT_UI } },
    seq: { task: 0, job: 0 }
  };
}

function sanitizeData(input) {
  const safe = input && typeof input === "object" ? input : {};
  const ui = safe.ui && typeof safe.ui === "object" ? safe.ui : {};
  const seq = safe.seq && typeof safe.seq === "object" ? safe.seq : {};

  return {
    version: 1,
    tasks: Array.isArray(safe.tasks) ? safe.tasks : [],
    jobs: Array.isArray(safe.jobs) ? safe.jobs : [],
    ui: {
      tasks: normalizeUi(ui.tasks),
      jobs: normalizeUi(ui.jobs)
    },
    seq: {
      task: Number.isFinite(seq.task) ? seq.task : 0,
      job: Number.isFinite(seq.job) ? seq.job : 0
    }
  };
}

module.exports = async function handler(req, res) {
  const auth = getAuth(req);
  if (!auth) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  if (req.method === "GET") {
    const found = await sql`SELECT data FROM user_data WHERE user_id = ${auth.uid}`;
    if (!found.rows.length) {
      const blank = defaultData();
      await sql`
        INSERT INTO user_data (user_id, data)
        VALUES (${auth.uid}, ${JSON.stringify(blank)}::jsonb)
        ON CONFLICT (user_id) DO NOTHING
      `;
      return sendJson(res, 200, blank);
    }

    const data = sanitizeData(found.rows[0].data);
    return sendJson(res, 200, data);
  }

  if (req.method === "PUT") {
    let body;
    try {
      body = await readJson(req);
    } catch {
      return sendJson(res, 400, { error: "Invalid JSON" });
    }

    const sanitized = sanitizeData(body);
    await sql`
      INSERT INTO user_data (user_id, data, updated_at)
      VALUES (${auth.uid}, ${JSON.stringify(sanitized)}::jsonb, NOW())
      ON CONFLICT (user_id) DO UPDATE
      SET data = ${JSON.stringify(sanitized)}::jsonb,
          updated_at = NOW()
    `;

    return sendJson(res, 200, { ok: true });
  }

  return sendJson(res, 405, { error: "Method not allowed" });
};

const CACHE_CONTROL = "no-store";

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", CACHE_CONTROL);
  res.end(JSON.stringify(data));
}

function sendEmpty(res, status) {
  res.statusCode = status;
  res.setHeader("Cache-Control", CACHE_CONTROL);
  res.end();
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (!chunks.length) return {};

  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return {};
  return JSON.parse(text);
}

module.exports = {
  sendJson,
  sendEmpty,
  readJson
};

const { sendJson } = require("../_utils");
const { getAuth } = require("../_auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const auth = getAuth(req);
  if (!auth) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  return sendJson(res, 200, { username: auth.username });
};

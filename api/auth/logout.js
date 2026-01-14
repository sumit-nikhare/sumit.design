const { sendEmpty } = require("../_utils");
const { clearAuthCookie } = require("../_auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end();
  }

  clearAuthCookie(res);
  return sendEmpty(res, 204);
};

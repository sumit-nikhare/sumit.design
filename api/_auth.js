const jwt = require("jsonwebtoken");
const { parse, serialize } = require("cookie");

const AUTH_COOKIE = "planner_token";
const AUTH_SECRET = process.env.AUTH_SECRET || "dev-secret-change-me";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

function signToken(user) {
  return jwt.sign(
    { uid: user.id, username: user.username },
    AUTH_SECRET,
    { expiresIn: TOKEN_TTL_SECONDS }
  );
}

function getAuth(req) {
  const cookieHeader = req.headers && req.headers.cookie ? req.headers.cookie : "";
  const cookies = parse(cookieHeader || "");
  const token = cookies[AUTH_COOKIE];
  if (!token) return null;

  try {
    return jwt.verify(token, AUTH_SECRET);
  } catch {
    return null;
  }
}

function setAuthCookie(res, user) {
  const token = signToken(user);
  const isProd = process.env.NODE_ENV === "production";
  const cookie = serialize(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: TOKEN_TTL_SECONDS
  });
  res.setHeader("Set-Cookie", cookie);
}

function clearAuthCookie(res) {
  const isProd = process.env.NODE_ENV === "production";
  const cookie = serialize(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 0
  });
  res.setHeader("Set-Cookie", cookie);
}

module.exports = {
  AUTH_COOKIE,
  getAuth,
  setAuthCookie,
  clearAuthCookie
};

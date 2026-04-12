const jwt = require("jsonwebtoken");

const API_SECRET = process.env.API_JWT_SECRET || "change-this-in-production";

function getBearerToken(req) {
  const authHeader = req.headers.authorization;
  return authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
}

function decodeToken(token) {
  return jwt.verify(token, API_SECRET);
}

function verifyToken(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  try {
    const payload = decodeToken(token);
    req.user = {
      tokenType: payload.token_type ?? "user",
      userId: payload.userId ?? null,
      role: payload.role ?? null,
      org_id: payload.org_id ?? payload.company_id ?? null
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function verifyIngestionToken(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  try {
    const payload = decodeToken(token);
    req.user = {
      tokenType: payload.token_type ?? "extension",
      userId: payload.userId ?? null,
      role: payload.role ?? null,
      org_id: payload.org_id ?? payload.company_id ?? null,
      device_id: payload.device_id ?? null
    };

    if (!req.user.org_id) {
      return res.status(401).json({ message: "Missing organization context" });
    }

    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  return next();
}

function requireUserOrAdmin(req, res, next) {
  if (req.user?.role === "admin" || req.user?.role === "user") {
    return next();
  }

  return res.status(403).json({ message: "Authenticated access required" });
}

module.exports = {
  decodeToken,
  getBearerToken,
  requireAdmin,
  requireUserOrAdmin,
  verifyIngestionToken,
  verifyToken
};

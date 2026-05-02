const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");
const { User } = require("../models/User");

async function verifyToken(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [, token] = header.split(" ");
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const payload = jwt.verify(token, jwtSecret);

    const user = await User.findById(payload.sub).select("_id name email role");
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

function checkRole(...roles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

module.exports = { verifyToken, checkRole };


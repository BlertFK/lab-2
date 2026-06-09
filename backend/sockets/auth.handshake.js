// B31: Socket.IO auth handshake — verifies the JWT access token presented on
// connect, attaches a normalised user object to socket, joins the user to
// user:{id}, and also to the admin broadcast room when applicable.

const { verifyAccess } = require("../utils/jwt.util");

function readToken(socket) {
  return (
    socket.handshake.auth?.token ||
    (socket.handshake.headers?.authorization || "").replace(/^Bearer\s+/i, "") ||
    socket.handshake.query?.token
  );
}

function handshake(socket, next) {
  const token = readToken(socket);
  if (!token) return next(new Error("Access denied. No token provided."));

  let payload;
  try {
    payload = verifyAccess(token);
  } catch (err) {
    return next(new Error(err.message || "Invalid or expired token."));
  }

  const roles = payload.roles || (payload.role ? [payload.role] : []);
  socket.user = {
    id: payload.sub || payload.id,
    sub: payload.sub || payload.id,
    email: payload.email,
    roles,
    role: roles[0] ? String(roles[0]).toLowerCase() : null,
    permissions: payload.permissions || [],
  };

  socket.join(`user:${socket.user.id}`);
  if (socket.user.roles.some((r) => String(r).toLowerCase() === "admin")) {
    socket.join("admin");
  }
  return next();
}

module.exports = { handshake };

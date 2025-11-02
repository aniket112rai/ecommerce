
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

/**
 * authMiddleware checks authentication and optionally role.
 * @param {string} [requiredRole] - pass "admin" to restrict access
 */
export const authMiddleware = (requiredRole) => async (req, res, next) => {
  try {
    const token = req.cookies.token; 
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }
      console.log("hi1")
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.role = decoded.role; 

    console.log("hi2")
    if (requiredRole && decoded.role !== requiredRole) {
      return res.status(403).json({ message: "Access denied" });
    }
    console.log("hi13")
    next();
  } catch (err) {
    console.error(err);
     console.log("hi4") 
    res.status(401).json({ message: "Invalid token" });
  }
};

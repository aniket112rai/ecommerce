import bcrypt from "bcryptjs";

import { OAuth2Client } from "google-auth-library";
import { sendToken } from "../utils/jwt.js";
import prisma from "../utils/prismaClient.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// REGISTER
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await prisma.user.findUnique({
    where: { email },
  });
  if (existing)
    return res.status(400).json({
      message: "Email already exists",
    });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, 
      email, 
      password: hashedPassword , 
      role:role === "admin" ? "admin" : "user",
      provider: "local"},
  });
  sendToken(res, user);
};

// LOGIN
export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: "Invalid credentials" });

  sendToken(res, user);
};

// GOOGLE LOGIN
export const googleLogin = async (req, res) => {
  const { tokenId } = req.body;
  const ticket = await client.verifyIdToken({
    idToken: tokenId,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  let user = await prisma.user.findUnique({ where: { email: payload.email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        provider: "google",
        providerId: payload.sub,
        role: role === "admin" ? "admin" : "user"
      },
    });
  }

  sendToken(res, user);
};

// GET CURRENT USER
export const getMe = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  res.json(user);
};

// UPDATE PROFILE/PASSWORD
export const updateMe = async (req, res) => {
  const { name, email, password } = req.body;
  const data = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (password) data.password = await bcrypt.hash(password, 10);

  const user = await prisma.user.update({ where: { id: req.userId }, data });
  res.json(user);
};

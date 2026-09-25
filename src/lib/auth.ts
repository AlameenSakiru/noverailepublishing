import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "noveraile_super_secret_jwt_key_development_32chars_minimum";
const COOKIE_NAME = "noveraile_session";
const SESSION_EXPIRY_DAYS = 30;

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${SESSION_EXPIRY_DAYS}d`,
  });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

import type { NextResponse } from "next/server";

export async function setSessionCookie(payload: SessionPayload, response?: NextResponse) {
  const token = signToken(payload);
  const cookieStore = cookies();
  
  // Set HTTP-only secure cookie safely (only HTTPS in production)
  const isSecure = process.env.NODE_ENV === "production" && (
    process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ?? false
  );

  const cookieOptions = {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_EXPIRY_DAYS,
  };

  try {
    cookieStore.set(COOKIE_NAME, token, cookieOptions);
  } catch (err) {
    // In some edge route handler contexts, cookieStore.set may warn
  }

  if (response) {
    try {
      response.cookies.set(COOKIE_NAME, token, cookieOptions);
    } catch (err) {
      console.warn("Failed to set cookie on response:", err);
    }
  }

  // Record session in database for device & session management
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);
    await prisma.session.create({
      data: {
        userId: payload.userId,
        token: token,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Failed to record DB session:", error);
  }

  return token;
}

export async function clearSessionCookie() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    try {
      await prisma.session.deleteMany({
        where: { token },
      });
    } catch (e) {
      console.error("Failed to delete DB session:", e);
    }
  }

  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  try {
    // Verify that the user still exists and is ACTIVE
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  } catch (error) {
    console.warn("Database lookup in getCurrentUser failed, falling back to verified JWT payload:", error);
    return {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  }
}

export async function requireAuth(): Promise<SessionPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const user = await requireAuth();
  if (user.role !== "ADMIN" && user.role !== "EDITOR") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

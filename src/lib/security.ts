import jwt from "jsonwebtoken";
import prisma from "./prisma";

const READER_SIGNING_SECRET = process.env.JWT_SECRET || "noveraile_super_secret_jwt_key_development_32chars_minimum";
const TOKEN_EXPIRY_MINUTES = 15;

export interface ReaderTokenPayload {
  userId: string;
  userEmail: string;
  bookId: string;
  expiresAt: number;
}

/**
 * Signs a short-lived reader access token (15 minutes).
 * Used by the reader client to fetch protected book assets.
 */
export function signReaderAccessToken(userId: string, userEmail: string, bookId: string): string {
  return jwt.sign(
    {
      userId,
      userEmail,
      bookId,
    },
    READER_SIGNING_SECRET,
    { expiresIn: `${TOKEN_EXPIRY_MINUTES}m` }
  );
}

/**
 * Validates a reader token. Returns null if invalid or expired.
 */
export function verifyReaderAccessToken(token: string): ReaderTokenPayload | null {
  try {
    const decoded = jwt.verify(token, READER_SIGNING_SECRET) as any;
    return {
      userId: decoded.userId,
      userEmail: decoded.userEmail,
      bookId: decoded.bookId,
      expiresAt: decoded.exp,
    };
  } catch {
    return null;
  }
}

export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
  isPreview: boolean;
  watermarkText?: string | null;
}

/**
 * Server-side authorization check for book reading access.
 * Validates:
 * 1. Is this a permitted preview page?
 * 2. Is the user an Admin / Editor?
 * 3. Does the user own an ACTIVE entitlement for this book?
 */
export async function verifyBookAccess(
  userId: string | null,
  userEmail: string | null,
  bookId: string,
  pageNumber: number
): Promise<AccessCheckResult> {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { id: true, previewPageNumbers: true, status: true },
  });

  if (!book) {
    return { allowed: false, reason: "BOOK_NOT_FOUND", isPreview: false, watermarkText: null };
  }

  // Parse preview page numbers
  let previewPages: number[] = [];
  try {
    previewPages = JSON.parse(book.previewPageNumbers || "[]");
  } catch {
    previewPages = [1, 2, 3, 4, 5];
  }
  if (!Array.isArray(previewPages) || previewPages.length === 0) {
    previewPages = [1, 2, 3, 4, 5];
  }

  const isPreviewPage = previewPages.includes(pageNumber);

  // If it is a preview page, it is publicly accessible
  if (isPreviewPage) {
    return {
      allowed: true,
      isPreview: true,
      watermarkText: null,
    };
  }

  // Non-preview pages require authenticated user with ownership
  if (!userId || !userEmail) {
    return { allowed: false, reason: "AUTHENTICATION_REQUIRED", isPreview: false, watermarkText: null };
  }

  // Check if user is ADMIN or EDITOR
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user && (user.role === "ADMIN" || user.role === "EDITOR")) {
    return {
      allowed: true,
      isPreview: false,
      watermarkText: null,
    };
  }

  // Check active entitlement
  const entitlement = await prisma.entitlement.findUnique({
    where: {
      userId_bookId: {
        userId,
        bookId,
      },
    },
    include: {
      order: {
        select: { orderNumber: true },
      },
    },
  });

  if (!entitlement || entitlement.status !== "ACTIVE") {
    return { allowed: false, reason: "NO_ACTIVE_ENTITLEMENT", isPreview: false, watermarkText: null };
  }

  return {
    allowed: true,
    isPreview: false,
    watermarkText: null,
  };
}

/**
 * High-performance, self-pruning in-memory rate limiter for sensitive endpoints
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
let lastPruneTime = Date.now();

function pruneExpiredRateLimits() {
  const now = Date.now();
  if (now - lastPruneTime < 60000 && rateLimitMap.size < 10000) return;
  lastPruneTime = now;

  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

export function checkRateLimit(key: string, limit: number = 60, windowMs: number = 60000): boolean {
  pruneExpiredRateLimits();

  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}

/**
 * Extracts normalized client IP address from standard reverse proxy headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "local_client";
}

/**
 * Sanitizes input text against basic XSS injection
 */
export function sanitizeString(input: string, maxLength: number = 500): string {
  if (!input || typeof input !== "string") return "";
  return input
    .trim()
    .replace(/[<>]/g, "")
    .slice(0, maxLength);
}

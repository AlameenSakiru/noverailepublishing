import { hashPassword, verifyPassword, signToken, verifyToken } from "../src/lib/auth";
import {
  signReaderAccessToken,
  verifyReaderAccessToken,
  checkRateLimit,
  sanitizeString,
} from "../src/lib/security";
import { storage } from "../src/lib/storage";

async function runSecurityAuditTests() {
  console.log("==================================================");
  console.log("🛡️  RUNNING COMPREHENSIVE SECURITY VERIFICATION  🛡️");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${detail ? `(${detail})` : ""}`);
      failed++;
    }
  }

  // 1. Password Hashing & Verification Security
  const plainPassword = "SuperSecretPassword123!";
  const hash = await hashPassword(plainPassword);
  assert("Bcrypt hash format", hash.startsWith("$2a$") || hash.startsWith("$2b$"));
  assert("Valid password verification", await verifyPassword(plainPassword, hash));
  assert("Invalid password rejection", !(await verifyPassword("WrongPassword123!", hash)));

  // 2. JWT Session Token Security
  const payload = {
    userId: "usr_test_123",
    email: "reader@noveraile.com",
    role: "CUSTOMER",
    name: "Test Reader",
  };
  const token = signToken(payload);
  const verified = verifyToken(token);
  assert("JWT Session Token Signing & Validation", verified?.userId === payload.userId && verified?.role === "CUSTOMER");
  assert("Tampered JWT Token Rejection", verifyToken(token + "tampered") === null);
  assert("Malformed JWT Token Rejection", verifyToken("invalid.jwt.token") === null);

  // 3. Reader Ephemeral Access Token Security
  const readerToken = signReaderAccessToken("usr_123", "reader@noveraile.com", "book_456");
  const verifiedReader = verifyReaderAccessToken(readerToken);
  assert("Reader Access Token Integrity", verifiedReader?.bookId === "book_456" && verifiedReader?.userId === "usr_123");
  assert("Tampered Reader Token Rejection", verifyReaderAccessToken(readerToken + "tampered") === null);

  // 4. Rate Limiting Integrity
  const rateLimitKey = `test_security_burst_${Date.now()}`;
  let allowedCount = 0;
  for (let i = 0; i < 15; i++) {
    if (checkRateLimit(rateLimitKey, 5, 60000)) {
      allowedCount++;
    }
  }
  assert("Rate Limiter Enforces Maximum Threshold", allowedCount === 5, `Allowed ${allowedCount}/15 requests`);

  // 5. Input Sanitization against XSS
  const maliciousInput = `<script>alert('XSS')</script>Hello <b>World</b>`;
  const sanitized = sanitizeString(maliciousInput);
  assert("HTML tag stripping sanitization", !sanitized.includes("<") && !sanitized.includes(">"));

  // 6. Private Storage Path Traversal Defense
  const traversalAttempt = "../../../etc/passwd";
  const traversalResult = await storage.readMasterFile(traversalAttempt);
  assert("Path Traversal in Storage Adapter Blocked", traversalResult === null);

  console.log("==================================================");
  console.log(`Security Test Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAuditTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});

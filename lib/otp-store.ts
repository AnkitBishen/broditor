// ── Shared in-memory OTP store ──
// Uses globalThis so the same Map is shared across all Next.js route modules
// (without this, send-otp and verify-otp each get their own empty Map)

type OtpEntry = {
  code: string;
  expiresAt: number;
  attempts: number;
};

const globalKey = "__otp_store__" as const;

function getStore(): Map<string, OtpEntry> {
  const g = globalThis as unknown as Record<string, Map<string, OtpEntry>>;
  if (!g[globalKey]) {
    g[globalKey] = new Map<string, OtpEntry>();
  }
  return g[globalKey];
}

const store = getStore();

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_MS = 60 * 1000; // 1 minute between resends

function cleanupExpired() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.expiresAt) {
      store.delete(key);
    }
  }
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createAndStoreOtp(email: string): {
  code: string;
  rateLimited?: boolean;
  waitSeconds?: number;
} {
  const normalizedEmail = email.trim().toLowerCase();

  // Rate limiting — prevent spam
  const existing = store.get(normalizedEmail);
  if (
    existing &&
    Date.now() < existing.expiresAt - (OTP_EXPIRY_MS - RATE_LIMIT_MS)
  ) {
    const waitSeconds = Math.ceil(
      (existing.expiresAt - (OTP_EXPIRY_MS - RATE_LIMIT_MS) - Date.now()) /
        1000
    );
    return { code: "", rateLimited: true, waitSeconds };
  }

  const code = generateOtp();
  store.set(normalizedEmail, {
    code,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
  });

  cleanupExpired();
  return { code };
}

export function verifyOtp(
  email: string,
  code: string
): { valid: boolean; message: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const entry = store.get(normalizedEmail);

  if (!entry) {
    return {
      valid: false,
      message: "No verification code found. Please request a new one.",
    };
  }

  if (Date.now() > entry.expiresAt) {
    store.delete(normalizedEmail);
    return {
      valid: false,
      message: "Verification code has expired. Please request a new one.",
    };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    store.delete(normalizedEmail);
    return {
      valid: false,
      message: "Too many incorrect attempts. Please request a new code.",
    };
  }

  if (entry.code !== code.trim()) {
    entry.attempts += 1;
    const remaining = MAX_ATTEMPTS - entry.attempts;
    return {
      valid: false,
      message:
        remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Too many incorrect attempts. Please request a new code.",
    };
  }

  // Valid — remove from store (one-time use)
  store.delete(normalizedEmail);
  return { valid: true, message: "Email verified successfully." };
}

export const OTP_EXPIRY_SECONDS = OTP_EXPIRY_MS / 1000;

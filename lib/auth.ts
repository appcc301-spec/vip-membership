import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { seedDatabase, verifyAdminCredentials } from "./members";
import bcrypt from "bcryptjs";

const secretKey = process.env.NEXTAUTH_SECRET || "fallback-secret-do-not-use-in-production";
const encodedKey = new TextEncoder().encode(secretKey);
const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: isProduction,
};

export type SessionUser = {
  id: string;
  email: string;
  role: "admin" | "member";
  name?: string;
};

export async function encrypt(payload: SessionUser & { expires: Date }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(encodedKey);
}

export async function decrypt(token: string | undefined = "") {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as SessionUser & { expires: string };
  } catch {
    return null;
  }
}

export async function createAdminSession(email: string, password: string) {
  await seedDatabase();
  const admin = await verifyAdminCredentials(email);
  if (!admin) return null;

  const passwordHash = process.env.ADMIN_PASSWORD_HASH || admin.passwordHash;
  const matches = await bcrypt.compare(password, passwordHash);
  if (!matches && password !== passwordHash) {
    return null;
  }
  const user: SessionUser = {
    id: admin.id,
    email: admin.email,
    role: "admin",
  };
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const token = await encrypt({ ...user, expires });
  const cookieStore = await cookies();
  cookieStore.set("session", token, { ...cookieOptions, expires });
  console.log("[auth] Admin session created for:", user.email, "secure:", cookieOptions.secure);
  return user;
}

export async function createMemberSession(id: string, email: string, name: string) {
  const user: SessionUser = { id, email, role: "member", name };
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const token = await encrypt({ ...user, expires });
  const cookieStore = await cookies();
  cookieStore.set("session", token, { ...cookieOptions, expires });
  return user;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) {
    console.log("[auth] No session cookie found");
    return null;
  }
  const session = await decrypt(token);
  if (!session) {
    console.warn("[auth] Session cookie failed to decrypt");
  }
  return session;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", { ...cookieOptions, expires: new Date(0) });
}

export async function requireAuth(role: "admin" | "member" | "any" = "any") {
  const session = await getSession();
  if (!session) {
    console.warn("[auth] requireAuth failed: no session");
    throw new Error("Unauthorized");
  }
  if (role !== "any" && session.role !== role) {
    console.warn("[auth] requireAuth failed: role mismatch. Required:", role, "Got:", session.role, "Email:", session.email);
    throw new Error("Forbidden");
  }
  console.log("[auth] requireAuth success. Role:", session.role, "Email:", session.email);
  return session;
}

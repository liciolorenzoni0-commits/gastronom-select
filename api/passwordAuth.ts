import * as jose from "jose";
import { env } from "./lib/env";

const JWT_ALG = "HS256";
const PASSWORD_COOKIE = "gs_session";

export interface PasswordPayload {
  admin: boolean;
  name: string;
}

export async function signPasswordToken(payload: PasswordPayload): Promise<string> {
  const secret = new TextEncoder().encode(env.appSecret + "_pw");
  return new jose.SignJWT({ admin: payload.admin, name: payload.name })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyPasswordToken(token: string): Promise<PasswordPayload | null> {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(env.appSecret + "_pw");
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
      clockTolerance: 60,
    });
    if (!payload.admin) return null;
    return { admin: true, name: (payload.name as string) || "Admin" };
  } catch {
    return null;
  }
}

export function getPasswordCookieName(): string {
  return PASSWORD_COOKIE;
}

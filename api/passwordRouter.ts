import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { signPasswordToken, verifyPasswordToken, getPasswordCookieName } from "./passwordAuth";
import { env } from "./lib/env";
import { TRPCError } from "@trpc/server";

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name) cookies[name] = rest.join("=");
  });
  return cookies;
}

function buildCookieString(
  name: string,
  value: string,
  opts: { httpOnly?: boolean; secure?: boolean; sameSite?: string; maxAge?: number; path?: string }
): string {
  let cookie = `${name}=${value}`;
  if (opts.path) cookie += `; Path=${opts.path}`;
  if (opts.httpOnly) cookie += "; HttpOnly";
  if (opts.secure) cookie += "; Secure";
  if (opts.sameSite) cookie += `; SameSite=${opts.sameSite}`;
  if (opts.maxAge !== undefined) cookie += `; Max-Age=${opts.maxAge}`;
  return cookie;
}

export const passwordRouter = createRouter({
  login: publicQuery
    .input(
      z.object({
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const adminPassword = process.env.ADMIN_PASSWORD || "gastronom2026";

      if (input.password !== adminPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Contrasena incorrecta",
        });
      }

      const token = await signPasswordToken({ admin: true, name: "Admin" });

      const cookieStr = buildCookieString(getPasswordCookieName(), token, {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: "Lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      });

      ctx.resHeaders.set("Set-Cookie", cookieStr);

      return { success: true, name: "Admin" };
    }),

  logout: publicQuery.mutation(async ({ ctx }) => {
    const clearCookie = buildCookieString(getPasswordCookieName(), "", {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: "Lax",
      maxAge: 0,
      path: "/",
    });

    ctx.resHeaders.set("Set-Cookie", clearCookie);

    return { success: true };
  }),

  me: publicQuery.query(async ({ ctx }) => {
    const req = ctx.req as Request;
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = parseCookies(cookieHeader);

    const token = cookies[getPasswordCookieName()];
    if (!token) return null;

    const payload = await verifyPasswordToken(token);
    if (!payload) return null;

    return {
      name: payload.name,
      role: "admin" as const,
      unionId: "admin",
    };
  }),
});

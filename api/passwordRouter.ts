import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { signPasswordToken, verifyPasswordToken, getPasswordCookieName } from "./passwordAuth";
import { setCookie, deleteCookie } from "hono/cookie";
import { env } from "./lib/env";
import { TRPCError } from "@trpc/server";

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
          message: "Contraseña incorrecta",
        });
      }

      const token = await signPasswordToken({ admin: true, name: "Admin" });

      setCookie(ctx.resHeaders as any, getPasswordCookieName(), token, {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: "Lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      });

      return { success: true };
    }),

  logout: publicQuery.mutation(async ({ ctx }) => {
    deleteCookie(ctx.resHeaders as any, getPasswordCookieName(), {
      path: "/",
    });
    return { success: true };
  }),

  me: publicQuery.query(async ({ ctx }) => {
    const req = ctx.req as Request;
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, v.join("=")];
      })
    );

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

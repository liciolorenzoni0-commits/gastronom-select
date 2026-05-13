import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";
import { verifyPasswordToken, getPasswordCookieName } from "./passwordAuth";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  // Try Kimi OAuth first
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // OAuth not available, try password auth
  }

  // If no OAuth user, try password auth
  if (!ctx.user) {
    try {
      const cookieHeader = opts.req.headers.get("cookie") || "";
      const cookies = Object.fromEntries(
        cookieHeader.split(";").map((c) => {
          const [k, ...v] = c.trim().split("=");
          return [k, v.join("=")];
        })
      );
      const token = cookies[getPasswordCookieName()];
      if (token) {
        const payload = await verifyPasswordToken(token);
        if (payload) {
          ctx.user = {
            id: 1,
            unionId: "admin",
            name: payload.name,
            email: null,
            avatar: null,
            role: "admin",
            createdAt: new Date(),
            updatedAt: new Date(),
            lastSignInAt: new Date(),
          } as User;
        }
      }
    } catch {
      // Password auth not available
    }
  }

  return ctx;
}

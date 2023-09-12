import { TRPCError } from "@trpc/server";
import { middleware } from "../trpc";

export const isLoggedIn = middleware(async (opts) => {
  const { ctx } = opts;
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const user = await opts.ctx.db.User.findOne({
    username: ctx.userId,
  });
  return opts.next({
    ctx: {
      user,
    },
  });
});

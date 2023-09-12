import { publicProcedure, router } from "../trpc";
import { z } from "zod";
import jwt, { sign } from "jsonwebtoken";
import { TRPCError } from "@trpc/server";
import { isLoggedIn } from "../middleware/user";
const userInputType = z.object({
  username: z.string(),
  email: z.string(),
  password: z.string(),
});
const userLoginType = z.object({
  username: z.string(),
  email: z.string(),
  password: z.string(),
});

const jwtSecret = process.env.JWT_SECRET;
export const userRouter = router({
  SignUp: publicProcedure.input(userInputType).mutation(async (opts) => {
    const username = opts.input.username;
    const email = opts.input.email;
    const password = opts.input.password;

    const existingUser = await opts.ctx.db.User.findOne({ email: email });

    if (existingUser) {
      return {
        error: "User with this email already exists",
      };
    } else {
      const newUser = new opts.ctx.db.User({
        username: username,
        email: email,
        password: password,
      });

      try {
        const savedUser: any = await newUser.save();

        const userId: string = savedUser[0]._id.toString();
        if (!jwtSecret) {
          return;
        }
        const token: string = jwt.sign({ userId: userId }, jwtSecret, {
          expiresIn: "1h",
        });
        return {
          token,
        };
      } catch (error) {
        return {
          error: "An error occurred while creating the user",
        };
      }
    }
  }),
  login: publicProcedure.input(userLoginType).mutation(async (opts) => {
    const username = opts.input.username;
    const email = opts.input.email;
    const password = opts.input.password;

    const user = await opts.ctx.db.User.findOne({ email });
    const userUsername = user?.username;
    const userPassword = user?.password;
    if (userPassword !== password || userUsername !== username) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (!jwtSecret) {
      return;
    }
    const token: string = jwt.sign({ userId: opts.ctx.userId }, jwtSecret, {
      expiresIn: "1h",
    });
  }),
  me: publicProcedure
    .use(isLoggedIn)
    .output(
      z.object({
        email: z.string(),
      })
    )
    .query(async (opts) => {
      const response = await opts.ctx.db.User.findById(opts.ctx.userId);
      if (!response) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return {
        email: response.username,
      };
    }),
});

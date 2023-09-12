import { router } from "./trpc";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { userRouter } from "./routers/user";
import { todoRouter } from "./routers/todo";
import jwt from "jsonwebtoken";
import { User, Todo } from "./db";
import cors from "cors";

const jwtSecret = process.env.JWT_SECRET;
const appRouter = router({
  user: userRouter,
  todo: todoRouter,
});

export type AppRouter = typeof appRouter;

const server = createHTTPServer({
  router: appRouter,
  middleware: cors(),
  createContext(opts) {
    let authHeader = opts.req.headers["authorization"];

    if (authHeader) {
      const token = authHeader.split(" ")[1];
      console.log(token);
      return new Promise<{
        db: { Todo: typeof Todo; User: typeof User };
        userId?: string;
      }>((resolve) => {
        if (!jwtSecret) {
          return;
        }
        jwt.verify(token, jwtSecret, (err, decoded) => {
          if (err) {
            ({ code: "User already exists" });
          } else {
            const user = decoded as { userId: string };
            if (user.userId) {
              resolve({ userId: user.userId, db: { Todo, User } });
            } else {
              resolve({ db: { Todo, User } });
            }
          }
        });
        return {
          db: { Todo, User },
        };
      });
    }

    return {
      db: { Todo, User },
    };
  },
});

server.listen(3000);

import { isLoggedIn } from "../middleware/user";
import { publicProcedure, router } from "../trpc";
import { z } from "zod";

const todoType = z.object({
  title: z.string(),
  description: z.string(),
});
export const todoRouter = router({
  createTodo: publicProcedure
    .input(todoType)
    .use(isLoggedIn)
    .mutation(async (opts) => {
      const title = opts.input.title;
      const description = opts.input.description;
      const newTodo = new opts.ctx.db.Todo({
        title,
        description,
        done: false,
        userId: opts.ctx.userId,
      });
      const response = await newTodo.save();
      return {
        id: response.id,
      };
    }),
  todoGet: publicProcedure
    .output(
      z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          done: z.boolean(),
        })
      )
    )
    .use(isLoggedIn)
    .query(async (opts) => {
      let todos = await opts.ctx.db.Todo.find({
        userId: opts.ctx.userId,
      });
      return todos.map((x) => ({
        title: x.title || "",
        description: x.description || "",
        done: x.done || false,
      }));
    }),
});

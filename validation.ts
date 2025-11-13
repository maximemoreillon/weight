import z from "zod";

export const pointSchema = z.object({
  time: z.coerce.date().default(() => new Date()),
  weight: z.coerce.number(),
});

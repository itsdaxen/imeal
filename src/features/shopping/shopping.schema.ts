import { z } from "zod";

export const listSchema = z.object({ listId: z.uuid() });

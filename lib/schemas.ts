import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 huruf"),
  price: z.coerce.number().min(1000, "Harga minimal 1000"),
});

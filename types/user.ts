import * as z from 'zod';

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
  PUBLIC_PROMPT_EDITOR = "publicPromptEditor"
}

export const UserSchema = z.object({
  _id: z.string().optional(),
  email: z.string(),
  name: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  monthlyUSDConsumptionLimit: z.union([z.number(), z.undefined()])
});

export const UserSchemaArray = z.array(UserSchema);

export type User = z.infer<typeof UserSchema>;

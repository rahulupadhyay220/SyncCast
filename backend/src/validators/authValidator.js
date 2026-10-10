import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  username: z.string().trim().min(2).max(50).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateRoleSchema = z.object({
  role: z.enum(['user', 'admin'], {
    errorMap: () => ({ message: "Role must be either 'user' or 'admin'" }),
  }),
});

export default {
  registerSchema,
  loginSchema,
  updateRoleSchema,
};

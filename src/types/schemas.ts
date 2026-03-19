import { z } from 'zod';

export const patientSchema = z.object({
  name: z.string().min(2).max(100),
  age: z.number().int().min(0).max(130),
  gender: z.enum(['Male', 'Female', 'Other']),
  status: z.enum(['Stable', 'Critical', 'Recovering']),
  condition: z.string().min(2).max(500),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().regex(/^[+\d\s\-()]{7,20}$/).optional().or(z.literal('')),
});

export type PatientFormData = z.infer<typeof patientSchema>;

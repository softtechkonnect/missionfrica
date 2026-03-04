import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['missionary', 'donor']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const missionaryProfileSchema = z.object({
  organizationName: z.string().min(2, 'Organization name is required'),
  organizationType: z.enum(['church_extension', 'independent']),
  isChurchRegistered: z.boolean().optional(),
  registrationNumber: z.string().optional(), // Optional for all organization types
  missionLocation: z.string().min(2, 'Mission location is required'),
  roleInOrg: z.string().min(2, 'Your role in the organization is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  whatsapp: z.string().min(10, 'Please enter a valid WhatsApp number'),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
})

export const postSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  content: z.string().min(50, 'Content must be at least 50 characters').max(5000, 'Content must be less than 5000 characters'),
})

export const donationSchema = z.object({
  amount: z.number().min(100, 'Minimum donation is $1.00').max(100000000, 'Maximum donation is $1,000,000'),
  donorName: z.string().optional(),
  donorEmail: z.string().email().optional(),
  message: z.string().max(500, 'Message must be less than 500 characters').optional(),
  isAnonymous: z.boolean().default(false),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type MissionaryProfileInput = z.infer<typeof missionaryProfileSchema>
export type PostInput = z.infer<typeof postSchema>
export type DonationInput = z.infer<typeof donationSchema>

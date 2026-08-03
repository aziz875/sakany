import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  fullName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères.'),
  email: z.string().email("Format d'email invalide."),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
    .regex(/(?=.*[A-Za-z])(?=.*\d)/, 'Le mot de passe doit contenir au moins une lettre et un chiffre.'),
  phone: z
    .string()
    .regex(/^(\+216)?[0-9]{8}$/, 'Format de téléphone invalide (ex: +21612345678 ou 12345678).'),
  role: z.enum(['STUDENT', 'LANDLORD'], 'Rôle invalide.'),
});

export const loginSchema = z.object({
  email: z.string().email("Format d'email invalide."),
  password: z.string().min(1, 'Le mot de passe est requis.'),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Format d'email invalide."),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Le token est requis.'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
    .regex(/(?=.*[A-Za-z])(?=.*\d)/, 'Le mot de passe doit contenir au moins une lettre et un chiffre.'),
});

// Listing schemas
export const createListingSchema = z.object({
  title: z.string().min(5, 'Le titre doit contenir au moins 5 caractères.').max(100),
  description: z.string().min(20, 'La description doit contenir au moins 20 caractères.').max(2000),
  pricePerMonth: z.number().positive('Le prix doit être positif.').max(10000, 'Prix trop élevé.'),
  roomType: z.enum(['CHAMBRE_COLOC', 'STUDIO', 'APPARTEMENT'], 'Type de logement invalide.'),
  distanceToCampus: z.number().min(0, 'La distance ne peut pas être négative.'),
  lat: z.number(),
  lng: z.number(),
  furnished: z.boolean().default(false),
});

export const updateListingSchema = createListingSchema.partial();

// Application schemas
export const applySchema = z.object({
  message: z.string().max(500, 'Le message est trop long.').optional(),
});

export const updateApplicationSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED'], 'Statut invalide.'),
});

// Review schemas
export const createReviewSchema = z.object({
  rating: z.number().min(1, 'La note doit être au moins 1.').max(5, 'La note ne peut pas dépasser 5.'),
  comment: z.string().min(10, 'Le commentaire doit contenir au moins 10 caractères.').max(500),
});

import { z } from 'zod';

export const RoleSchema = z.enum(['ADMIN', 'PROVIDER', 'BUYER']);

export const RegisterSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Minimo 8 caracteres'),
  name: z.string().min(2, 'Nombre demasiado corto'),
  role: z.enum(['PROVIDER', 'BUYER']),
  companyName: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional()
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const ProductSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  category: z.string().min(2),
  unit: z.string().min(1),
  pricePerUnit: z.coerce.number().positive(),
  minOrderQty: z.coerce.number().int().positive(),
  originCity: z.string().min(2),
  originCountry: z.string().default('Colombia'),
  imageUrl: z.string().url().optional().or(z.literal(''))
});

export const PAYMENT_METHODS = ['TRANSFER', 'CARD', 'CASH'] as const;
export const PAYMENT_CONDITIONS = ['UPFRONT', 'ON_DELIVERY', 'CREDIT_30'] as const;

export const QuoteSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  destinationCity: z.string().min(2),
  destinationCountry: z.string().min(2),
  incoterm: z.enum(['EXW', 'FOB', 'CIF', 'DDP']).default('FOB'),
  paymentMethod: z.enum(PAYMENT_METHODS).default('TRANSFER'),
  paymentCondition: z.enum(PAYMENT_CONDITIONS).default('ON_DELIVERY'),
  notes: z.string().optional()
});

export const QuoteUpdateSchema = z.object({
  status: z.enum(['PENDING', 'QUOTED', 'ACCEPTED', 'REJECTED']),
  logisticsCost: z.coerce.number().nonnegative().optional(),
  customsCost: z.coerce.number().nonnegative().optional(),
  totalEstimated: z.coerce.number().nonnegative().optional(),
  adminNotes: z.string().optional()
});

// --- Moderacion del administrador (v2) ---

export const ModerationSchema = z.object({
  approvalStatus: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional()
});

// --- Ordenes de compra (v2) ---

export const PurchaseOrderDeadlineSchema = z.object({
  preparationDeadline: z.coerce.date(),
  providerNotes: z.string().optional()
});

export const PurchaseOrderStatusSchema = z.object({
  status: z.enum(['PREPARING', 'READY', 'SHIPPED', 'DELIVERED', 'CANCELED'])
});

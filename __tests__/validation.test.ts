import {
  QuoteSchema,
  RegisterSchema,
  ModerationSchema,
  PurchaseOrderStatusSchema,
  PurchaseOrderDeadlineSchema
} from '@/lib/validation';

describe('QuoteSchema (cotización + condiciones de pago)', () => {
  const base = {
    productId: 'prod_123',
    quantity: 10,
    destinationCity: 'Santiago',
    destinationCountry: 'Chile'
  };

  it('acepta una cotización válida y aplica los valores por defecto de pago', () => {
    const result = QuoteSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.incoterm).toBe('FOB');
      expect(result.data.paymentMethod).toBe('TRANSFER');
      expect(result.data.paymentCondition).toBe('ON_DELIVERY');
    }
  });

  it('respeta la forma y condición de pago indicadas', () => {
    const result = QuoteSchema.safeParse({
      ...base,
      paymentMethod: 'CARD',
      paymentCondition: 'CREDIT_30'
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.paymentMethod).toBe('CARD');
      expect(result.data.paymentCondition).toBe('CREDIT_30');
    }
  });

  it('rechaza una cantidad no positiva', () => {
    const result = QuoteSchema.safeParse({ ...base, quantity: -5 });
    expect(result.success).toBe(false);
  });

  it('rechaza una forma de pago no soportada', () => {
    const result = QuoteSchema.safeParse({ ...base, paymentMethod: 'BITCOIN' });
    expect(result.success).toBe(false);
  });
});

describe('RegisterSchema (registro de usuarios)', () => {
  const base = {
    email: 'nuevo@latamtradex.com',
    password: 'segura123',
    name: 'Nuevo Usuario',
    role: 'BUYER'
  };

  it('acepta un registro válido de comprador', () => {
    expect(RegisterSchema.safeParse(base).success).toBe(true);
  });

  it('rechaza contraseñas demasiado cortas', () => {
    expect(RegisterSchema.safeParse({ ...base, password: '123' }).success).toBe(false);
  });

  it('no permite auto-registrarse como ADMIN', () => {
    expect(RegisterSchema.safeParse({ ...base, role: 'ADMIN' }).success).toBe(false);
  });
});

describe('ModerationSchema (aprobación del administrador)', () => {
  it('acepta APPROVED', () => {
    expect(ModerationSchema.safeParse({ approvalStatus: 'APPROVED' }).success).toBe(true);
  });

  it('acepta REJECTED con motivo', () => {
    const result = ModerationSchema.safeParse({
      approvalStatus: 'REJECTED',
      rejectionReason: 'Falta certificado fitosanitario'
    });
    expect(result.success).toBe(true);
  });

  it('rechaza un estado de moderación inválido', () => {
    expect(ModerationSchema.safeParse({ approvalStatus: 'PENDING' }).success).toBe(false);
  });
});

describe('PurchaseOrder (órdenes de compra)', () => {
  it('PurchaseOrderStatusSchema acepta un avance válido de estado', () => {
    expect(PurchaseOrderStatusSchema.safeParse({ status: 'PREPARING' }).success).toBe(true);
  });

  it('PurchaseOrderStatusSchema no permite "GENERATED" como avance manual', () => {
    expect(PurchaseOrderStatusSchema.safeParse({ status: 'GENERATED' }).success).toBe(false);
  });

  it('PurchaseOrderDeadlineSchema convierte una fecha en string a Date', () => {
    const result = PurchaseOrderDeadlineSchema.safeParse({
      preparationDeadline: '2026-12-31'
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.preparationDeadline).toBeInstanceOf(Date);
    }
  });
});

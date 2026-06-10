import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Latamtradex2026!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@latamtradex.com' },
    update: {},
    create: {
      email: 'admin@latamtradex.com',
      passwordHash,
      name: 'Administrador Latamtradex',
      role: 'ADMIN',
      country: 'Colombia'
    }
  });

  const provider = await prisma.user.upsert({
    where: { email: 'proveedor@latamtradex.com' },
    update: {},
    create: {
      email: 'proveedor@latamtradex.com',
      passwordHash,
      name: 'Maria Gomez',
      role: 'PROVIDER',
      companyName: 'AgroExport SAS',
      country: 'Colombia',
      phone: '+57 300 1234567'
    }
  });

  const buyer = await prisma.user.upsert({
    where: { email: 'comprador@latamtradex.com' },
    update: {},
    create: {
      email: 'comprador@latamtradex.com',
      passwordHash,
      name: 'Carlos Rojas',
      role: 'BUYER',
      companyName: 'Importadora Andina SpA',
      country: 'Chile',
      phone: '+56 9 87654321'
    }
  });

  const products = [
    {
      name: 'Café arábica especialidad - lavado',
      description:
        'Café arábica de altura, proceso lavado, perfil dulce con notas a panela y frutos rojos. Certificado para exportación.',
      category: 'Alimentos',
      unit: 'kg',
      pricePerUnit: 9.5,
      minOrderQty: 250,
      originCity: 'Manizales',
      imageUrl:
        'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Cacao fino de aroma en grano',
      description:
        'Cacao fino de aroma, fermentado y secado al sol. Apto para chocolate de origen, certificación orgánica disponible.',
      category: 'Alimentos',
      unit: 'kg',
      pricePerUnit: 6.2,
      minOrderQty: 500,
      originCity: 'Santa Marta',
      imageUrl:
        'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Aguacate Hass calidad exportación',
      description:
        'Aguacate Hass calibre 16-20, libre de plagas, con tratamiento poscosecha y certificación fitosanitaria ICA.',
      category: 'Frutas',
      unit: 'caja',
      pricePerUnit: 28.0,
      minOrderQty: 80,
      originCity: 'Medellín',
      imageUrl:
        'https://images.unsplash.com/photo-1601039641847-7857b994d704?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Panela orgánica granulada',
      description:
        'Panela orgánica granulada, empaque al vacío de 1 kg. Cumple normativa de etiquetado para Chile y Perú.',
      category: 'Alimentos',
      unit: 'kg',
      pricePerUnit: 3.1,
      minOrderQty: 1000,
      originCity: 'Bogotá',
      imageUrl:
        'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Flores frescas - Rosas variedad Freedom',
      description:
        'Bouquet de rosas Freedom, tallo 60 cm, cadena de frío garantizada hasta puerto de destino.',
      category: 'Floricultura',
      unit: 'tallo',
      pricePerUnit: 0.85,
      minOrderQty: 2000,
      originCity: 'Bogotá',
      imageUrl:
        'https://images.unsplash.com/photo-1496062031456-07b8f162a322?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Artesanías en mopa-mopa (Barniz de Pasto)',
      description:
        'Piezas artesanales con técnica ancestral del barniz de Pasto, declaradas patrimonio inmaterial de la humanidad.',
      category: 'Artesanías',
      unit: 'pieza',
      pricePerUnit: 45.0,
      minOrderQty: 20,
      originCity: 'Pasto',
      imageUrl:
        'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=800&q=80'
    }
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({
        data: {
          ...p,
          providerId: provider.id,
          // Productos demo ya moderados para que sean visibles en el catalogo
          approvalStatus: 'APPROVED',
          reviewedAt: new Date(),
          reviewedById: admin.id
        }
      });
    }
  }

  const services = [
    {
      slug: 'certificacion-exportacion',
      title: 'Asesoría en Certificación para Exportación',
      description:
        'Acompañamos a su empresa en la obtención de certificaciones fitosanitarias, sanitarias y de calidad requeridas por mercados internacionales.',
      priceUsd: 350,
      durationHrs: 8,
      category: 'CERTIFICATION'
    },
    {
      slug: 'apertura-nuevos-mercados',
      title: 'Apertura de Nuevos Mercados (Chile y Perú)',
      description:
        'Diagnóstico de viabilidad, identificación de canales, contactos con importadores y plan comercial para ingresar a Chile y Perú.',
      priceUsd: 780,
      durationHrs: 20,
      category: 'NEW_MARKETS'
    },
    {
      slug: 'optimizacion-logistica-aduanera',
      title: 'Optimización Logística y Aduanera',
      description:
        'Revisión integral de su operación de exportación, clasificación arancelaria y optimización de costos logísticos puerta a puerta.',
      priceUsd: 540,
      durationHrs: 14,
      category: 'CERTIFICATION'
    }
  ];

  for (const s of services) {
    await prisma.advisoryService.upsert({
      where: { slug: s.slug },
      update: {},
      create: s
    });
  }

  console.log('Seed completo:');
  console.log(`  - Admin:     ${admin.email} / Latamtradex2026!`);
  console.log(`  - Proveedor: ${provider.email} / Latamtradex2026!`);
  console.log(`  - Comprador: ${buyer.email} / Latamtradex2026!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

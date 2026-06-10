import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DocumentManager from './DocumentManager';

export const dynamic = 'force-dynamic';

export default async function DocumentosPage() {
  const session = await getSession();
  if (!session || session.role !== 'PROVIDER') redirect('/login');

  const [documents, products] = await Promise.all([
    prisma.document.findMany({
      where: { providerId: session.userId },
      orderBy: { uploadedAt: 'desc' },
      include: { product: { select: { name: true } } }
    }),
    prisma.product.findMany({
      where: { providerId: session.userId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Documentación técnica</h1>
      <p className="text-sm text-slate-600 mb-6">
        Sube certificados de calidad, fitosanitarios y otros documentos que respaldan la
        viabilidad de exportación de tus productos. Solo tú y el equipo de Latamtradex pueden
        verlos.
      </p>
      <DocumentManager
        documents={documents.map((d) => ({
          id: d.id,
          title: d.title,
          type: d.type,
          fileUrl: d.fileUrl,
          fileSize: d.fileSize,
          uploadedAt: d.uploadedAt.toISOString(),
          productName: d.product?.name ?? null,
          approvalStatus: d.approvalStatus,
          rejectionReason: d.rejectionReason
        }))}
        products={products}
      />
    </div>
  );
}

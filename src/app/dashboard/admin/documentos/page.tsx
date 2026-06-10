import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DocumentModeration from './DocumentModeration';

export const dynamic = 'force-dynamic';

export default async function AdminDocumentosPage() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') redirect('/login');

  const documents = await prisma.document.findMany({
    orderBy: [{ approvalStatus: 'asc' }, { uploadedAt: 'desc' }],
    include: {
      provider: { select: { name: true, companyName: true } },
      product: { select: { name: true } }
    }
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Moderación de documentos</h1>
      <p className="text-sm text-slate-600 mb-6">
        Verifica los certificados y fichas técnicas. Solo los documentos aprobados se muestran
        en la ficha pública del producto.
      </p>
      <DocumentModeration
        documents={documents.map((d) => ({
          id: d.id,
          title: d.title,
          type: d.type,
          fileUrl: d.fileUrl,
          approvalStatus: d.approvalStatus,
          rejectionReason: d.rejectionReason,
          providerName: d.provider.companyName ?? d.provider.name,
          productName: d.product?.name ?? null
        }))}
      />
    </div>
  );
}

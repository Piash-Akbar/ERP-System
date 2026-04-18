import { documentService } from '@/server/services/document.service';
import { getSession } from '@/server/auth/session';
import { ApiError } from '@/lib/errors';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession();
    const file = await documentService.download(session, id);
    const body = new Uint8Array(file.buffer);
    return new Response(body, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Length': String(file.size),
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.fileName)}"`,
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return new Response(e.message, { status: e.status });
    }
    throw e;
  }
}

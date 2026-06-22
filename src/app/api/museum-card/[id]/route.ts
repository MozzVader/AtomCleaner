import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateMuseumCardHtml } from '@/lib/exporter';
import { cleanContent } from '@/lib/atom-parser';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entry = await db.blogEntry.findUnique({
    where: { id },
    select: {
      title: true,
      content: true,
      publishedAt: true,
      author: true,
      originalUrl: true,
      labels: true,
      status: true,
      issues: true,
      wordCount: true,
      platforms: true,
      nostalgiaScore: true,
      smokeIndex: true,
    },
  });

  if (!entry) {
    return NextResponse.json({ error: 'Entrada no encontrada' }, { status: 404 });
  }

  const cleanedContent = cleanContent(entry.content);
  const html = generateMuseumCardHtml({
    ...entry,
    content: cleanedContent,
  });

  return NextResponse.json({ title: entry.title, html });
}
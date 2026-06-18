import { NextRequest, NextResponse } from 'next/server';
import { parseAtomXml } from '@/lib/atom-parser';

/**
 * Diagnostic endpoint that uses the REAL parseAtomXml function
 * and returns the full result WITHOUT storing anything in the DB.
 * This helps us see exactly what the parser returns.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 });
    }

    const xmlString = await file.text();

    // Show first 500 chars of the XML (to verify we got the right file)
    const xmlPreview = xmlString.substring(0, 500);

    // Call the REAL parser
    const result = parseAtomXml(xmlString);

    // Return the first 10 entries with FULL details
    const sampleEntries = result.entries.slice(0, 10).map((e, i) => ({
      index: i,
      entryId: e.entryId,
      entryType: e.entryType,
      title: e.title || '(empty)',
      titleLength: e.title.length,
      contentLength: e.content.length,
      contentPreview: e.content.substring(0, 150),
      publishedAt: e.publishedAt,
      author: e.author,
      labels: e.labels,
      originalUrl: e.originalUrl,
      commentCount: e.commentCount,
      parentId: e.parentId,
    }));

    // Count titles
    const withTitle = result.entries.filter(e => e.title && e.title.trim().length > 0).length;
    const withoutTitle = result.entries.length - withTitle;

    // Type breakdown
    const typeCounts: Record<string, number> = {};
    for (const e of result.entries) {
      typeCounts[e.entryType] = (typeCounts[e.entryType] || 0) + 1;
    }

    return NextResponse.json({
      _note: 'Este endpoint usa la función parseAtomXml REAL (la misma que el upload)',
      xmlPreview,
      xmlLength: xmlString.length,
      blogTitle: result.blogTitle,
      blogAuthor: result.blogAuthor,
      blogUrl: result.blogUrl,
      totalEntries: result.entries.length,
      skippedTypes: result.skippedTypes,
      debugInfo: result.debugInfo,
      typeCounts,
      titleStats: { withTitle, withoutTitle },
      sampleEntries,
    });
  } catch (error) {
    console.error('Parse test error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error interno',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
  const JIRA_USER = process.env.JIRA_USER;
  const JIRA_PASSWORD = process.env.JIRA_PASSWORD;
  const imageUrl = req.nextUrl.searchParams.get('url');

  if (!JIRA_BASE_URL || !JIRA_USER || !JIRA_PASSWORD || !imageUrl) {
    return new NextResponse('Missing parameters', { status: 400 });
  }

  // Solo permitimos proxy a imágenes de jira.tid.es
  if (!imageUrl.startsWith(JIRA_BASE_URL)) {
    return new NextResponse('Invalid image URL', { status: 403 });
  }

  const auth = Buffer.from(`${JIRA_USER}:${JIRA_PASSWORD}`).toString('base64');

  const response = await fetch(imageUrl, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'image/png,image/jpeg,image/*,*/*',
    },
  });

  if (!response.ok) {
    return new NextResponse('Could not fetch image', { status: 502 });
  }

  const contentType = response.headers.get('content-type') || 'image/png';
  const arrayBuffer = await response.arrayBuffer();
  return new NextResponse(Buffer.from(arrayBuffer), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

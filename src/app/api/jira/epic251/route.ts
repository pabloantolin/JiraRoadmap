import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
  const JIRA_USER = process.env.JIRA_USER;
  const JIRA_PASSWORD = process.env.JIRA_PASSWORD;
  const EPIC_KEY = 'JEFE-251';

  if (!JIRA_BASE_URL || !JIRA_USER || !JIRA_PASSWORD) {
    return NextResponse.json({ error: 'Missing Jira credentials' }, { status: 500 });
  }

  const auth = Buffer.from(`${JIRA_USER}:${JIRA_PASSWORD}`).toString('base64');
  // Consultar todos los campos de la épica para identificar el custom field correcto
  const url = `${JIRA_BASE_URL}/rest/api/2/issue/${EPIC_KEY}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json({
      key: data.key,
      fields: data.fields
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

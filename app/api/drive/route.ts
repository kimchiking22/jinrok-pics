import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    const credentialsVar = process.env.GOOGLE_CREDENTIALS;
    if (!credentialsVar) {
      return NextResponse.json({ error: '인증 정보가 없습니다.' }, { status: 500 });
    }

    const credentials = JSON.parse(credentialsVar);

    // 🔥 핵심 수정 사항: Vercel이 망가뜨린 줄바꿈 기호(\\n)를 정상적인 엔터(\n)로 강제 복구합니다.
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, webContentLink, mimeType)',
    });

    return NextResponse.json({ files: response.data.files || [] });
    
  } catch (error: any) {
    console.error('Google Drive API Error:', error);
    return NextResponse.json({ error: error.message || '사진을 가져오지 못했습니다.' }, { status: 500 });
  }
}
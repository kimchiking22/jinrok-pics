import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    const credentialsVar = process.env.GOOGLE_CREDENTIALS;
    if (!credentialsVar) {
      return NextResponse.json({ error: '인증 정보가 없습니다.' }, { status: 500 });
    }

    const credentials = JSON.parse(credentialsVar);
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
      // 🔥 핵심 수정: 맨 끝에 thumbnailLink를 추가했습니다!
      fields: 'files(id, name, webContentLink, mimeType, createdTime, thumbnailLink)',
    });

    return NextResponse.json({ files: response.data.files || [] });
    
  } catch (error: any) {
    console.error('Google Drive API Error:', error);
    return NextResponse.json({ error: error.message || '사진을 가져오지 못했습니다.' }, { status: 500 });
  }
}
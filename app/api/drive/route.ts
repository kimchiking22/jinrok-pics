import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    // 파일 대신 환경 변수에서 열쇠 정보를 직접 읽어옵니다.
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');

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

    return NextResponse.json({ files: response.data.files });
    
  } catch (error) {
    console.error('Google Drive API Error:', error);
    return NextResponse.json({ error: '사진을 가져오지 못했습니다.' }, { status: 500 });
  }
}
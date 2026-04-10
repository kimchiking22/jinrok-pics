import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';

export async function GET() {
  try {
    // 1. 구글 인증 설정 (프로젝트 루트에 google-credentials.json 파일이 있어야 함)
    const keyFilePath = path.join(process.cwd(), 'google-credentials.json');
    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });
    
    // 2. .env.local에 저장한 폴더 ID 가져오기
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // 3. 폴더 내 사진 목록 불러오기
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, webContentLink, mimeType)',
    });

    const files = response.data.files;

    return NextResponse.json({ files });
    
  } catch (error) {
    console.error('Google Drive API Error:', error);
    return NextResponse.json({ error: '사진을 가져오지 못했습니다.' }, { status: 500 });
  }
}
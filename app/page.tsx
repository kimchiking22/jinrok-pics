'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

// 날짜별 정리 함수
const groupByDate = (files: any[]) => {
  return files.reduce((groups: any, file: any) => {
    if (!file.createdTime) return groups;
    const dateStr = file.createdTime.split('T')[0];
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(file);
    return groups;
  }, {});
};

// 구글 보안을 우회해서 고화질 이미지를 가져오는 함수
const getImageUrl = (file: any) => {
  if (file.thumbnailLink) {
    // 썸네일 주소를 원본 화질(=s0)로 변경
    return file.thumbnailLink.replace(/=s\d+$/, '=s0');
  }
  return ''; 
};

export default function Page() {
  const { data: session, status } = useSession();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchFiles = async () => {
        try {
          const res = await fetch('/api/drive');
          const data = await res.json();
          if (data.files) {
            setFiles(data.files);
          }
        } catch (error) {
          console.error('파일 로드 실패:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchFiles();
    }
  }, [status]);

  // 로그인 체크
  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center">연결 중...</div>;

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F7]">
        <h1 className="text-3xl font-semibold mb-8 text-gray-900">우리가족 사진첩</h1>
        <button
          onClick={() => signIn('kakao')}
          className="bg-[#FEE500] text-black font-bold py-3 px-8 rounded-full shadow-sm"
        >
          카카오로 시작하기
        </button>
      </div>
    );
  }

  const groupedFiles = groupByDate(files);
  const sortedDates = Object.keys(groupedFiles).sort().reverse();

  return (
    <div className="min-h-screen bg-white pb-10">
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-10 border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">사진첩</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{session?.user?.name}님</span>
          <button onClick={() => signOut()} className="text-sm text-blue-500 font-medium">로그아웃</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto pt-6 px-[1px]">
        {loading ? (
          <div className="text-center py-20 text-gray-400">사진을 불러오고 있습니다...</div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-20 text-gray-400">사진이 없습니다.</div>
        ) : (
          sortedDates.map(date => (
            <div key={date} className="mb-8">
              <h2 className="text-base font-semibold mb-2 px-4 text-gray-900">{date}</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-[2px]">
                {groupedFiles[date].map((file: any) => (
                  <div key={file.id} className="aspect-square relative bg-gray-100 overflow-hidden">
                    {file.mimeType.includes('video') ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-white">
                        <span className="text-xl">▶️</span>
                        <span className="text-[10px] mt-1">동영상</span>
                      </div>
                    ) : (
                      <img 
                        src={getImageUrl(file)} 
                        alt={file.name} 
                        // 🔥 중요: 구글 보안 차단을 뚫기 위한 옵션
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
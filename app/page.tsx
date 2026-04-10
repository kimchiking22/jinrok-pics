'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

// 1. 날짜별 분류 함수
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

// 2. 구글 드라이브 이미지 엑박 방지용 주소 변환기
const getImageUrl = (fileId: string) => {
  if (!fileId) return '';
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

export default function Page() {
  const { data: session, status } = useSession();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchFiles = async () => {
        try {
          const res = await fetch('/api/drive');
          const data = await res.json();
          if (data.files) {
            // 데이터가 제대로 들어오는지 터미널 로그로 확인용
            console.log("불러온 파일 목록:", data.files);
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

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">연결 중...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F7]">
        <h1 className="text-3xl font-semibold mb-8 tracking-tight text-gray-900">진록이 사진첩</h1>
        <button
          onClick={() => signIn('kakao')}
          className="bg-[#FEE500] text-[#000000] font-bold py-3 px-8 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2"
        >
          카카오로 시작하기
        </button>
      </div>
    );
  }

  const groupedFiles = groupByDate(files);
  const sortedDates = Object.keys(groupedFiles).sort().reverse();

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-semibold tracking-tight">사진첩</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 font-medium">{session?.user?.name}님</span>
          <button onClick={() => signOut()} className="text-sm text-blue-500 font-medium">로그아웃</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto pt-6 px-[1px]">
        {loading ? (
          <div className="text-center py-20 text-gray-400">사진을 가져오고 있습니다...</div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-20 text-gray-400">표시할 사진이 없습니다.</div>
        ) : (
          sortedDates.map(date => (
            <div key={date} className="mb-8">
              <h2 className="text-base font-semibold mb-2 px-4 text-gray-900">{date}</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-[2px]">
                {groupedFiles[date].map((file: any) => (
                  <div 
                    key={file.id} 
                    className="aspect-square relative cursor-pointer bg-gray-100 overflow-hidden"
                    onClick={() => setSelectedFile(file)}
                  >
                    {file.mimeType.includes('video') ? (
                      <div className="w-full h-full flex items-center justify-center bg-[#1c1c1e] text-white">
                        <span className="text-2xl">▶️</span>
                        <span className="absolute bottom-1 right-1 text-[10px] bg-black/50 px-1 rounded">비디오</span>
                      </div>
                    ) : (
                      <img 
                        src={getImageUrl(file.id)} 
                        alt={file.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-opacity hover:opacity-90"
                        onError={(e) => {
                          // 사진이 안 뜰 경우 대체 텍스트 표시
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Image+Error';
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {/* 3. 확대 모달 (라이트박스) */}
      {selectedFile && (
        <div 
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedFile(null)}
        >
          <button className="absolute top-6 right-6 text-white text-4xl font-light">&times;</button>
          <div className="max-w-full max-h-full flex items-center justify-center">
            {selectedFile.mimeType.includes('video') ? (
              <video 
                src={selectedFile.webContentLink} 
                controls 
                autoPlay 
                className="max-h-[90vh] max-w-full"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img 
                src={getImageUrl(selectedFile.id)} 
                alt={selectedFile.name}
                referrerPolicy="no-referrer"
                className="max-h-[90vh] max-w-full object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
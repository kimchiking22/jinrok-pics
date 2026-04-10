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

const getImageUrl = (fileId: string) => `https://drive.google.com/uc?export=view&id=${fileId}`;
  
export default function Page() {
  const { data: session, status } = useSession(); // 로그인 상태 확인
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  // 구글 드라이브 파일 불러오기
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

  // 구글 드라이브 이미지 직접 표시용 URL 변환 함수
  const getImageUrl = (fileId: string) => `https://drive.google.com/uc?export=view&id=${fileId}`;

  // 1. 로딩 화면
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">로딩중...</div>;
  }

  // 2. 로그인 화면 (로그인이 안 되어 있을 때)
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F7]">
        <h1 className="text-3xl font-semibold mb-8 tracking-tight text-gray-900">Jinrok Photos</h1>
        <button
          onClick={() => signIn('kakao')}
          className="bg-[#FEE500] text-[#000000] font-bold py-3 px-8 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c-5.52 0-10 3.58-10 8 0 2.86 1.83 5.37 4.54 6.88l-1.15 4.22c-.1.35.31.63.6.43l4.89-3.23c.36.03.73.06 1.12.06 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
          </svg>
          카카오로 시작하기
        </button>
      </div>
    );
  }

  // 3. 갤러리 화면 (로그인 완료 시)
  const groupedFiles = groupByDate(files);
  const sortedDates = Object.keys(groupedFiles).sort().reverse();

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* 아이클라우드 스타일 헤더 */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-semibold tracking-tight">사진첩</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 font-medium">{session?.user?.name}님</span>
          <button 
            onClick={() => signOut()} 
            className="text-sm text-blue-500 hover:text-blue-600 font-medium"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 메인 갤러리 */}
      <main className="max-w-5xl mx-auto pt-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400">사진을 동기화하는 중입니다...</div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-20 text-gray-400">표시할 사진이 없습니다.</div>
        ) : (
          sortedDates.map(date => (
            <div key={date} className="mb-8">
              {/* 날짜 텍스트 */}
              <h2 className="text-base font-semibold mb-2 px-4 text-gray-900">{date}</h2>
              
              {/* 아이폰 스타일 딱 붙는 틈(gap) 그리드 */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-[2px]">
                {groupedFiles[date].map((file: any) => (
              <div 
                key={file.id} 
                className="aspect-square relative cursor-pointer"
                onClick={() => setSelectedFile(file)}
              >
                {file.mimeType.includes('video') ? (
                  // 비디오 아이콘 표시 부분
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    <span className="text-white text-xs">영상</span>
                  </div>
                ) : (
                  // 🌟 사진 표시 부분 수정 🌟
                  // 기존: <img src={file.webContentLink} ... />
                  // 🔥 변경: 위에서 만든 getImageUrl 함수를 사용합니다.
                  <img 
                    src={getImageUrl(file.id)} 
                    alt={file.name} 
                    className="w-full h-full object-cover rounded" 
                  />
                )}
              </div>
            ))}
                      <img 
                        // 🔥 엑스박스 해결: 구글 직접 보기 링크 적용
                        src={getImageUrl(file.id)} 
                        alt={file.name} 
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {/* 모달 (확대 화면) */}
      {selectedFile && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity"
          onClick={() => setSelectedFile(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white text-4xl font-light z-50 p-2"
            onClick={() => setSelectedFile(null)}
          >
            &times;
          </button>

          <div className="w-full h-full flex items-center justify-center p-4 sm:p-12">
            {selectedFile.mimeType.includes('video') ? (
              <video 
                src={selectedFile.webContentLink} 
                controls 
                autoPlay 
                className="max-h-full max-w-full rounded-md shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img 
                src={getImageUrl(selectedFile.id)} 
                alt={selectedFile.name}
                className="max-h-full max-w-full object-contain rounded-sm shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
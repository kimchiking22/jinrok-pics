'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

// 1. 날짜별 정리 함수 (2026-04-10 형태로 분류)
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

// 🔥 핵심 추가: 구글 드라이브 이미지를 웹에서 바로 볼 수 있게 주소를 변환하는 함수
const getImageUrl = (fileId: string) => `https://drive.google.com/uc?export=view&id=${fileId}`;

export default function Page() {
  const { data: session, status } = useSession(); // 카카오 로그인 상태 확인
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<any>(null); // 클릭한 파일(확대용)

  // 2. 로그인되어 있을 때만 구글 드라이브에서 사진 불러오기
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

  // --- 화면 렌더링 파트 ---

  // 상태 1: 로딩 중일 때 보여줄 화면
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">로딩중...</div>;
  }

  // 상태 2: 로그인이 안 되어 있을 때 보여줄 카카오 로그인 화면
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F7]">
        <h1 className="text-3xl font-semibold mb-8 tracking-tight text-gray-900">우리가족 사진첩</h1>
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

  // 상태 3: 로그인 완료 시 보여줄 메인 갤러리 화면
  const groupedFiles = groupByDate(files);
  const sortedDates = Object.keys(groupedFiles).sort().reverse(); // 최신 날짜가 위로 오게 정렬

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* 상단 헤더 영역 */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
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

      {/* 메인 사진 목록 영역 */}
      <main className="max-w-5xl mx-auto pt-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400">사진을 동기화하는 중입니다...</div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-20 text-gray-400">표시할 사진이 없습니다.</div>
        ) : (
          sortedDates.map(date => (
            <div key={date} className="mb-8">
              {/* 날짜 제목 */}
              <h2 className="text-base font-semibold mb-2 px-4 text-gray-900">{date}</h2>
              
              {/* 아이폰 감성: 사진 간격 2px로 딱 달라붙는 그리드 */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-[2px]">
                {groupedFiles[date].map((file: any) => (
                  <div 
                    key={file.id} 
                    className="aspect-square relative cursor-pointer bg-gray-100 overflow-hidden"
                    onClick={() => setSelectedFile(file)}
                  >
                    {/* 파일 타입이 비디오일 경우 */}
                    {file.mimeType.includes('video') ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#1c1c1e] text-white relative">
                        {/* 재생 아이콘 */}
                        <svg className="w-8 h-8 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        <span className="absolute bottom-1 right-1 text-[10px] bg-black/50 px-1.5 py-0.5 rounded">비디오</span>
                      </div>
                    ) : (
                      {/* 파일 타입이 사진일 경우: getImageUrl 함수로 엑스박스 방지 */}
                      <img 
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

      {/* 3. 모달 (사진 클릭 시 전체화면으로 확대해주는 창) */}
      {selectedFile && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity"
          onClick={() => setSelectedFile(null)} // 검은 배경 누르면 닫힘
        >
          {/* X 닫기 버튼 */}
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white text-4xl font-light z-50 p-2"
            onClick={() => setSelectedFile(null)}
          >
            &times;
          </button>

          <div className="w-full h-full flex items-center justify-center p-4 sm:p-12">
            {selectedFile.mimeType.includes('video') ? (
              // 비디오 전체화면 재생
              <video 
                src={selectedFile.webContentLink} 
                controls 
                autoPlay 
                className="max-h-full max-w-full rounded-md shadow-2xl outline-none"
                onClick={(e) => e.stopPropagation()} // 영상 누를 땐 안 닫히게 방지
              />
            ) : (
              // 이미지 전체화면 확대
              <img 
                src={getImageUrl(selectedFile.id)} 
                alt={selectedFile.name}
                className="max-h-full max-w-full object-contain rounded-sm shadow-2xl"
                onClick={(e) => e.stopPropagation()} // 사진 누를 땐 안 닫히게 방지
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react'; // 로그아웃 기능

// 1. 사진을 날짜별로 묶어주는 정리 함수 (아이폰 갤러리처럼)
const groupByDate = (files: any[]) => {
  return files.reduce((groups: any, file: any) => {
    // 날짜 정보가 없으면 건너뜀
    if (!file.createdTime) return groups;
    
    // 2026-04-10 형태로 날짜만 딱 잘라냄
    const dateStr = file.createdTime.split('T')[0]; 
    
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(file);
    return groups;
  }, {});
};

export default function Page() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<any>(null); // 확대할 사진/영상 저장

  // 2. 구글 드라이브에서 사진과 영상 가져오기
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch('/api/drive');
        const data = await res.json();
        if (data.files) {
          setFiles(data.files);
        }
      } catch (error) {
        console.error('파일을 불러오는데 실패했습니다:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  // 3. 가져온 사진을 날짜별로 그룹화하고 최신순으로 정렬
  const groupedFiles = groupByDate(files);
  const sortedDates = Object.keys(groupedFiles).sort().reverse();

  return (
    <div className="min-h-screen bg-white pb-10">
      {/* 상단 헤더 */}
      <header className="bg-white p-4 flex justify-between items-center sticky top-0 z-10 border-b">
        <h1 className="text-xl font-bold">사진첩</h1>
        <button 
          onClick={() => signOut()} 
          className="text-sm text-blue-500 hover:text-blue-700 font-semibold"
        >
          로그아웃
        </button>
      </header>

      {/* 메인 갤러리 영역 */}
      <main className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="text-center py-20 text-gray-500">사진을 불러오는 중입니다...</div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-20 text-gray-500">사진이 없습니다.</div>
        ) : (
          sortedDates.map(date => (
            <div key={date} className="mb-8">
              {/* 날짜 제목 (예: 2026-04-10) */}
              <h2 className="text-lg font-bold mb-3 pl-1">{date}</h2>
              
              {/* 사진/영상 바둑판(그리드) 배열 */}
              <div className="grid grid-cols-3 gap-1">
                {groupedFiles[date].map((file: any) => (
                  <div 
                    key={file.id} 
                    className="aspect-square relative cursor-pointer bg-gray-100 overflow-hidden"
                    onClick={() => setSelectedFile(file)} // 클릭 시 모달창 열림
                  >
                    {file.mimeType.includes('video') ? (
                      // 영상일 경우 표시되는 모양
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200">
                        <span className="text-2xl mb-1">▶️</span>
                        <span className="text-xs text-gray-500 truncate px-2 w-full text-center">
                          {file.name}
                        </span>
                      </div>
                    ) : (
                      // 사진일 경우 표시되는 모양
                      <img 
                        src={file.webContentLink} 
                        alt={file.name} 
                        className="w-full h-full object-cover hover:opacity-80 transition-opacity" 
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {/* 4. 사진 확대 & 영상 재생 팝업 (모달) */}
      {selectedFile && (
        <div 
          className="fixed inset-0 bg-black flex items-center justify-center z-50"
          onClick={() => setSelectedFile(null)} // 검은 배경 누르면 닫힘
        >
          {/* 닫기 버튼 (우측 상단) */}
          <button 
            className="absolute top-4 right-4 text-white text-3xl font-light z-50 p-2"
            onClick={() => setSelectedFile(null)}
          >
            &times;
          </button>

          <div className="w-full h-full flex items-center justify-center p-4">
            {selectedFile.mimeType.includes('video') ? (
              // 영상 플레이어
              <video 
                src={selectedFile.webContentLink} 
                controls 
                autoPlay 
                className="max-h-full max-w-full outline-none"
                onClick={(e) => e.stopPropagation()} // 영상 영역 클릭 시 닫힘 방지
              />
            ) : (
              // 확대된 사진
              <img 
                src={selectedFile.webContentLink} 
                alt={selectedFile.name}
                className="max-h-full max-w-full object-contain"
                onClick={(e) => e.stopPropagation()} // 사진 영역 클릭 시 닫힘 방지
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

const groupByDate = (files: any[]) => {
  return files.reduce((groups: any, file: any) => {
    if (!file.createdTime) return groups;
    const dateStr = file.createdTime.split('T');
    if (!groups) {
      groups = [];
    }
    groups.push(file);
    return groups;
  }, {});
};

const getHighResImageUrl = (file: any) => {
  if (file.thumbnailLink) {
    return file.thumbnailLink.replace(/=s\d+$/, '=s0');
  }
  return ''; 
};

export default function Page() {
  const { data: session, status } = useSession();
  
  // 🔥 잘려나갔던 변수명 완벽 복구
  const = useState<any[]>([]);
  const = useState(true);
  const = useState<any>(null);

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
  },); // 🔥 잘려나갔던 괄호 복구

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-">연결 중...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-">
        <h1 className="text-3xl font-semibold mb-8 tracking-tight text-gray-900">우리가족 사진첩</h1>
        <button
          onClick={() => signIn('kakao')}
          className="bg- text-black font-bold py-3 px-8 rounded-full shadow-sm hover:shadow-md transition-all"
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

      <main className="max-w-5xl mx-auto pt-6 px-">
        {loading ? (
          <div className="text-center py-20 text-gray-400">사진을 가져오고 있습니다...</div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-20 text-gray-400">표시할 사진이 없습니다.</div>
        ) : (
          sortedDates.map(date => (
            <div key={date} className="mb-8">
              <h2 className="text-base font-semibold mb-2 px-4 text-gray-900">{date}</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-">
                {groupedFiles.map((file: any) => (
                  <div 
                    key={file.id} 
                    className="aspect-square relative cursor-pointer bg-gray-100 overflow-hidden"
                    onClick={() => setSelectedFile(file)}
                  >
                    {file.mimeType.includes('video') ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white relative">
                        <span className="text-2xl mb-1">▶️</span>
                        <span className="text- bg-black/50 px-1.5 py-0.5 rounded">비디오</span>
                      </div>
                    ) : (
                      <img 
                        src={getHighResImageUrl(file)} 
                        alt={file.name} 
                        referrerPolicy="no-referrer"
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

      {/* 팝업 모달 창 */}
      {selectedFile && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity"
          onClick={() => setSelectedFile(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white text-4xl font-light z-50 p-2"
            onClick={() => setSelectedFile(null)}
          >
            &times;
          </button>

          <div className="w-full h-full flex items-center justify-center sm:p-12">
            {selectedFile.mimeType.includes('video') ? (
              <video 
                src={`https://drive.google.com/videoplayback?id=${selectedFile.id}`} 
                controls 
                autoPlay 
                playsInline 
                preload="metadata"
                className="max-h- max-w-full rounded-md shadow-2xl outline-none bg-black"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img 
                src={getHighResImageUrl(selectedFile)} 
                alt={selectedFile.name}
                referrerPolicy="no-referrer"
                className="max-h- max-w-full object-contain rounded-sm shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
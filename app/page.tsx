"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export default function Home() {
  const { data: session } = useSession();
  const [photos, setPhotos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) {
      setIsLoading(true);
      fetch('/api/drive')
        .then(res => res.json())
        .then(data => {
          if (data.files) setPhotos(data.files);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [session]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">📸 진록이네 사진첩</h1>
        <button 
          onClick={() => signIn('kakao')} 
          className="bg-[#FEE500] text-[#3c1e1e] font-bold py-3 px-10 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          카카오 로그인
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-black">
      {/* 헤더 부분 */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold tracking-tight">사진</h1>
          <button onClick={() => signOut()} className="text-blue-500 font-medium hover:text-blue-600">
            로그아웃
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-40">
            <p className="text-gray-500 animate-pulse text-lg">사진을 불러오는 중...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map(photo => {
              // 구글 드라이브 아이디로 직접 이미지 링크 생성
              const imageUrl = `https://lh3.google.com/u/0/d/${photo.id}`;
              
              return (
                <div key={photo.id} className="group relative aspect-square bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                  <img 
                    src={imageUrl} 
                    alt={photo.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      // 이미지가 안 뜰 경우 대체 아이콘 표시
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/400?text=No+Image";
                    }}
                  />
                  {/* 마우스 올렸을 때 이름 살짝 보여주기 */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <p className="text-white text-xs truncate w-full">{photo.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
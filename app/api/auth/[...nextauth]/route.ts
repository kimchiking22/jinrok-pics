import NextAuth from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";

const handler = NextAuth({
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID || "",
      clientSecret: process.env.KAKAO_CLIENT_SECRET || process.env.KAKAO_CLIENT_ID || "",
    }),
  ],
  // 보안을 위한 비밀키 (아무 문자나 길게 적으셔도 됩니다)
  secret: process.env.NEXTAUTH_SECRET || "any-secret-key-1234",
});

export { handler as GET, handler as POST };
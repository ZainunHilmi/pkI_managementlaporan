import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Konfigurasi NextAuth (SRS §5.1): Credentials provider + session JWT.
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.isActive) return null;

        const valid = await compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // Pengaman: izinkan callback URL absolut ke *.vercel.app (domain
    // production) walau NEXTAUTH_URL lupa diganti dari localhost.
    // Path relatif tetap di-resolve terhadap baseUrl seperti default.
    async redirect({ url, baseUrl }) {
      try {
        const target = url.startsWith("/") ? new URL(url, baseUrl) : new URL(url);
        if (/\.vercel\.app$/.test(target.hostname)) return target.toString();
        if (target.origin === baseUrl) return target.toString();
      } catch {
        /* abaikan, fallback ke baseUrl di bawah */
      }
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "USER";
      }
      return session;
    },
  },
};

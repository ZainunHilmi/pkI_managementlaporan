import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Langkah 4 SRS §9 + FR-AUTH-01: handler NextAuth (App Router).
// next-auth v4: perlu export GET dan POST secara eksplisit.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// app/lib/auth.ts

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import type { NextAuthOptions, User as AuthUser } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

type UserRole = 'super_administrador' | 'administrador' | 'vendedor' | 'cliente' | 'sistemas';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("InvalidCredentials");
          }
    
          await connectDB();
        
          const user = await User.findOne({
            email: credentials.email,
          }).select("+password");
        
          if (!user) {
            throw new Error("InvalidCredentials");
          }
        
          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );
        
          if (!passwordMatch) {
            throw new Error("InvalidCredentials");
          }
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
            phone: user.phone,
            image: user.image,
            location: user.location, // Agregamos el campo location
          };
        } catch (error) {
          console.error("Error in authorize function:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as AuthUser & { role: UserRole }).role;
        token.phone = (user as AuthUser & { phone?: string }).phone;
        token.image = (user as AuthUser & { image?: string }).image;
        token.location = (user as AuthUser & { location?: string }).location; // Agregamos el campo location
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.phone = token.phone as string | undefined;
        session.user.image = token.image as string | undefined;
        session.user.location = token.location as string | undefined; // Agregamos el campo location
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 120 * 60,
  },
  jwt: {
    maxAge: 120 * 60,
  },
  secret: process.env.AUTH_SECRET
};

export default authOptions;
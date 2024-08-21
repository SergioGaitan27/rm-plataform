// types/next-auth.d.ts

import NextAuth from "next-auth"

export type UserRole = 'super_administrador' | 'administrador' | 'vendedor' | 'cliente' | 'sistemas';

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | undefined
      role: UserRole
      phone?: string | null
      location?: string | null // Agregamos el campo location
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | undefined
    role: UserRole
    phone?: string | null
    location?: string | null // Agregamos el campo location
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    name?: string | null
    email?: string | null
    picture?: string | null
    role: UserRole
    phone?: string | null
    location?: string | null // Agregamos el campo location
  }
}
"use client";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from 'next/image';

export default function Login() {
    const [error, setError] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const router = useRouter();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        
        try {
            const formData = new FormData(event.currentTarget);
            const res = await signIn("credentials", {
                email: formData.get("email"),
                password: formData.get("password"),
                redirect: false,
                callbackUrl: "/dashboard",
            });
    
            if (res?.error === "InvalidCredentials") {
                setError("Credenciales inválidas. Por favor, intenta de nuevo.");
            } else if (res?.error) {
                setError(`Error en el inicio de sesión: ${res.error}`);
            } else if (res?.ok) {
                router.push("/dashboard");
            }
        } catch (error) {
            console.error("Error durante el inicio de sesión:", error);
            setError("Ocurrió un error inesperado. Por favor, intenta de nuevo.");
        }
    };

    return (
      <section className="w-full min-h-screen bg-black text-yellow-400 p-6 flex flex-col items-center justify-center">
        <div className="mb-8">
          <Image src="/icon.png" alt="Logo" width={80} height={80} />
        </div>
        <form
          className="w-full max-w-[400px] flex flex-col gap-4 bg-gray-900 p-8 rounded-lg shadow-md"
          onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-center mb-4">{error}</div>}
          <h1 className="text-3xl font-bold mb-6 text-center text-yellow-400">Iniciar Sesión</h1>
          
          <div>
            <label className="block text-sm font-semibold mb-2" htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="Ingresa tu correo electrónico"
              className="w-full px-4 py-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white"
              name="email"
              autoComplete="email" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="Ingresa tu contraseña"
              className="w-full px-4 py-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white"
              name="password"
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="rememberMe" className="text-sm">Recordarme</label>
          </div>
          
          <button 
            className="mt-6 w-full bg-yellow-400 text-black font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 hover:bg-yellow-500 transition duration-150 ease-in-out">
            Iniciar Sesión
          </button>
  
          <Link
            href="/register"
            className="mt-4 text-center text-sm text-yellow-400 hover:text-yellow-300 transition duration-150 ease-in-out">
            ¿No tienes una cuenta? Regístrate
          </Link>
        </form>
      </section>
  );
};
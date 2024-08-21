"use client";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/actions/register";
import Image from 'next/image';

export default function Register() {
  const [error, setError] = useState<string>();
  const [location, setLocation] = useState<string>('');
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    const r = await register({
      email: formData.get("email"),
      password: formData.get("password"),
      name: formData.get("name"),
      location: formData.get("location")
    });
    ref.current?.reset();
    if(r?.error){
      setError(r.error);
      return;
    } else if (r?.success) {
      router.push("/login");
    } else {
      setError("An unexpected error occurred");
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value.toUpperCase());
  };

  return (
    <section className="w-full min-h-screen bg-black text-yellow-400 p-6 flex flex-col items-center justify-center">
      <div className="mb-8">
        <Image src="/icon.png" alt="Logo" width={80} height={80} />
      </div>
      <form
        ref={ref}
        action={handleSubmit}
        className="w-full max-w-[400px] flex flex-col gap-4 bg-gray-900 p-8 rounded-lg shadow-md"
      >
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        <h1 className="text-3xl font-bold mb-6 text-center text-yellow-400">Registro</h1>
        
        <div>
          <label className="block text-sm font-semibold mb-2" htmlFor="name">Nombre Completo</label>
          <input
            id="name"
            type="text"
            placeholder="Ingresa tu nombre completo"
            className="w-full px-4 py-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white"
            name="name"
            autoComplete="name"
          />
        </div>
        
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
            placeholder="Crea una contraseña"
            className="w-full px-4 py-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white"
            name="password"
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" htmlFor="location">Ubicación</label>
          <input
            id="location"
            type="text"
            placeholder="Ingresa tu ubicación"
            className="w-full px-4 py-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white uppercase"
            name="location"
            value={location}
            onChange={handleLocationChange}
          />
        </div>
        
        <button 
          className="mt-6 w-full bg-yellow-400 text-black font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 hover:bg-yellow-500 transition duration-150 ease-in-out">
          Registrarse
        </button>

        <Link
          href="/login"
          className="mt-4 text-center text-sm text-yellow-400 hover:text-yellow-300 transition duration-150 ease-in-out">
          ¿Ya tienes una cuenta? Inicia sesión
        </Link>
      </form>
    </section>
  );
}
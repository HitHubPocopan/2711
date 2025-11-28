// src/app/page.tsx
'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Login() {
  const router = useRouter()
  // Usamos '1' como Sucursal Centro por defecto, 'admin' para el Dashboard Global
  const [storeId, setStoreId] = useState('1') 

  const handleLogin = () => {
    // Almacenamos la sucursal activa en el navegador para usarla en el POS
    localStorage.setItem('sucursal_activa', storeId)
    
    if (storeId === 'admin') {
       router.push('/dashboard') // Redirige al Dashboard Global
    } else {
       router.push('/pos') // Redirige al Punto de Venta
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="p-8 bg-white rounded shadow-xl w-96">
        <h1 className="text-3xl font-bold mb-6 text-center text-black">Ingreso al Sistema POS</h1>
        <label className="block mb-2 text-black font-semibold">Selecciona tu Rol y Sucursal:</label>
        <select 
          className="w-full p-3 border border-gray-300 rounded mb-6 text-black focus:ring-blue-500 focus:border-blue-500"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
        >
          <option value="1">Vendedor - Local Centro</option>
          <option value="2">Vendedor - Local Shopping</option>
          <option value="3">Vendedor - Depósito</option>
          <option value="admin">ADMINISTRADOR - (Dashboard Global)</option>
        </select>
        <button 
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition duration-150"
        >
          Ingresar al Sistema
        </button>
      </div>
    </div>
  )
}

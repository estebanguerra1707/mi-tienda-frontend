// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Providers from '@/app/Providers'
import AppLayout from '@/app/AppLayout'
import LoginPage from '@/features/auth/pages/LoginPage'
import DashboardPage from '@/features/dashboard/pages/DashboardPage'
import ProtectedRoute from '@/routes/ProtectedRoute'
import { Toaster } from 'react-hot-toast' 

import './index.css'
import RegisterUser from './features/auth/pages/RegisterUser'
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage'
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage'
import TokenExpiredPage from "@/features/auth/pages/TokenExpiredPage";

localStorage.removeItem('jwt');
localStorage.removeItem('role');
localStorage.removeItem('branchId');
localStorage.removeItem('businessType');
localStorage.removeItem('username');


const router = createBrowserRouter([
  
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterUser /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
    { path: '/reset-password', element: <ResetPasswordPage /> },
    { path: '/token-expired', element: <TokenExpiredPage /> },
  
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppLayout />, 
        children: [
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'productos',
            lazy: async () => ({ Component: (await import('@/features/productos/pages/ListPage')).default }),
          },
          {
            path: 'ventas',
            lazy: async () => ({ Component: (await import('@/features/ventas/pages/VentasListPage')).default }),
          },
          {
            path: 'devoluciones',
            lazy: async () => ({ Component: (await import('@/features/devolucion/DevolucionPage')).default }),
          },
            {
             element: <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]} />,
              children: [
                {
                  path: 'reportes',
                  lazy: async () => ({ Component: (await import('@/features/reportes/pages/ReportesPage')).default }),
                },
                {
                  path: 'compras',
                  lazy: async () => ({ Component: (await import('@/features/compras/pages/ComprasListPage')).default }),
                },
                {
                  path: "inventario",
                  lazy: async () => ({
                    Component: (await import("@/features/inventario/pages/InventarioListPage")).default,
                  }),
                },
                {
                  path: "categorias",
                  lazy: async () => ({ Component: (await import("@/features/categorias/pages/CategoriaListPage")).default }),
                },
                {
                  path: "sucursales",
                  lazy: async () => ({
                    Component: (await import("@/features/sucursales/pages/SucursalListPage")).default,
                  }),
                },
                {
                  path: "usuarios",
                  lazy: async () => ({
                    Component: (await import("@/features/usuarios/pages/UserListPage")).default,
                  }),
                },
                {
                  path: "usuarios/nuevo",
                  lazy: async () => ({
                    Component: (await import("@/features/usuarios/pages/UserCreatePage")).default,
                  }),
                },
                {
                  path: "usuarios/:id/editar",
                  lazy: async () => ({
                    Component: (await import("@/features/usuarios/pages/UserEditPage")).default,
                  }),
                },
                {
                  path: 'clientes',
                  lazy: async () => ({ Component: (await import('@/features/clientes/pages/ClienteListPage')).default }),
                },
                {
                  children: [
                    {
                      path: "proveedores",
                      lazy: async () => ({
                        Component: (await import("@/features/proveedores/pages/ProveedorListPage")).default,
                      }),
                    },
                    {
                      path: "proveedores/nuevo",
                      lazy: async () => ({
                        Component: (await import("@/features/proveedores/components/ProveedorCreatePage")).default,
                      }),
                    },
                    {
                      path: "proveedores/:id/editar",
                      lazy: async () => ({
                        Component: (await import("@/features/proveedores/components/ProveedoresEditPage")).default,
                      }),
                    },
                  ],
                }
              ],
          },
        ],
      },
    ],
  },
  
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <RouterProvider router={router} />
       <Toaster position="top-right" />
    </Providers>
  </React.StrictMode>
)

import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'

import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import LoginPage from './pages/Auth/LoginPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import ProductsPage from './pages/Products/ProductsPage'
import ProductFormPage from './pages/Products/ProductFormPage'
import StockPage from './pages/Stock/StockPage'
import SuppliersPage from './pages/Suppliers/SuppliersPage'
import SupplierFormPage from './pages/Suppliers/SupplierFormPage'
import UsersPage from './pages/Users/UsersPage'
import ProfilePage from './pages/Profile/ProfilePage'
import LoadingSpinner from './components/Common/LoadingSpinner'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Produits */}
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/new" element={<ProductFormPage />} />
        <Route path="/products/:id/edit" element={<ProductFormPage />} />
        
        {/* Stock */}
        <Route path="/stock" element={<StockPage />} />
        
        {/* Fournisseurs */}
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/suppliers/new" element={<SupplierFormPage />} />
        <Route path="/suppliers/:id/edit" element={<SupplierFormPage />} />
        
        {/* Utilisateurs (admin seulement) */}
        {user.role === 'admin' && (
          <Route path="/users" element={<UsersPage />} />
        )}
        
        {/* Profil */}
        <Route path="/profile" element={<ProfilePage />} />
        
        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
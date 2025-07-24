import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
  InputAdornment,
  IconButton,
} from '@mui/material'
import { Visibility, VisibilityOff, Inventory } from '@mui/icons-material'
import { useForm } from 'react-hook-form'

import { useAuth } from '../../contexts/AuthContext'

const LoginPage = () => {
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')

    const result = await login(data.email, data.password)
    
    if (!result.success) {
      setError(result.message)
    }
    
    setLoading(false)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #152046 0%, #96a4d3 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #152046 0%, #aa8f76 100%)',
              color: 'white',
              p: 4,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <Inventory sx={{ fontSize: 48, mr: 1 }} />
            </Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              StockApp
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Gestion de stock modulaire
            </Typography>
          </Box>

          {/* Formulaire */}
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom textAlign="center" mb={3}>
              Connexion
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                margin="normal"
                {...register('email', {
                  required: 'Email requis',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Email invalide',
                  },
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                margin="normal"
                {...register('password', {
                  required: 'Mot de passe requis',
                  minLength: {
                    value: 6,
                    message: 'Minimum 6 caractères',
                  },
                })}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                }}
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </Box>

            {/* Comptes de test */}
            <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                Comptes de test :
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Admin:</strong> admin@stockapp.com / password123<br />
                <strong>Magasinier:</strong> magasinier@stockapp.com / password123<br />
                <strong>Commercial:</strong> commercial@stockapp.com / password123
              </Typography>
            </Box>
          </CardContent>
        </Paper>
      </Container>
    </Box>
  )
}

export default LoginPage
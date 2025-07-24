import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
  Avatar,
  Chip,
} from '@mui/material'
import { Save, Lock, Person } from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { useMutation, useQueryClient } from 'react-query'

import { useAuth } from '../../contexts/AuthContext'
import { usersAPI } from '../../services/api'

const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const queryClient = useQueryClient()
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  // Formulaire profil
  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
    },
  })

  // Formulaire mot de passe
  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm({
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  // Mutation pour mettre à jour le profil
  const updateProfileMutation = useMutation(usersAPI.updateProfile, {
    onSuccess: (response) => {
      updateUser(response.data.user)
      queryClient.invalidateQueries('users')
    },
  })

  // Mutation pour changer le mot de passe
  const updatePasswordMutation = useMutation(usersAPI.updatePassword, {
    onSuccess: () => {
      resetPassword()
      setShowPasswordForm(false)
    },
  })

  const onProfileSubmit = (data) => {
    updateProfileMutation.mutate(data)
  }

  const onPasswordSubmit = (data) => {
    if (data.new_password !== data.confirm_password) {
      return
    }
    updatePasswordMutation.mutate({
      current_password: data.current_password,
      new_password: data.new_password,
    })
  }

  const getRoleLabel = (role) => {
    const roles = {
      admin: 'Administrateur',
      magasinier: 'Magasinier',
      commercial: 'Commercial'
    }
    return roles[role] || role
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error'
      case 'magasinier': return 'primary'
      case 'commercial': return 'success'
      default: return 'default'
    }
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Mon Profil
      </Typography>

      <Grid container spacing={3}>
        {/* Informations générales */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                }}
              >
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </Avatar>
              
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {user?.first_name} {user?.last_name}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user?.email}
              </Typography>
              
              <Chip
                label={getRoleLabel(user?.role)}
                color={getRoleColor(user?.role)}
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Formulaire profil */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <Person sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  Informations personnelles
                </Typography>
              </Box>

              {updateProfileMutation.error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {updateProfileMutation.error.response?.data?.message || 'Une erreur est survenue'}
                </Alert>
              )}

              {updateProfileMutation.isSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Profil mis à jour avec succès
                </Alert>
              )}

              <Box component="form" onSubmit={handleProfileSubmit(onProfileSubmit)}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="first_name"
                      control={profileControl}
                      rules={{ required: 'Prénom requis' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Prénom"
                          error={!!profileErrors.first_name}
                          helperText={profileErrors.first_name?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="last_name"
                      control={profileControl}
                      rules={{ required: 'Nom requis' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Nom"
                          error={!!profileErrors.last_name}
                          helperText={profileErrors.last_name?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={user?.email || ''}
                      disabled
                      helperText="L'email ne peut pas être modifié"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box display="flex" gap={2} justifyContent="flex-end">
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<Save />}
                        disabled={updateProfileMutation.isLoading}
                      >
                        {updateProfileMutation.isLoading ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>

          {/* Changement de mot de passe */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box display="flex" alignItems="center">
                  <Lock sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Sécurité
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                  {showPasswordForm ? 'Annuler' : 'Changer le mot de passe'}
                </Button>
              </Box>

              {showPasswordForm && (
                <>
                  <Divider sx={{ mb: 3 }} />

                  {updatePasswordMutation.error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {updatePasswordMutation.error.response?.data?.message || 'Une erreur est survenue'}
                    </Alert>
                  )}

                  {updatePasswordMutation.isSuccess && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                      Mot de passe mis à jour avec succès
                    </Alert>
                  )}

                  <Box component="form" onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Controller
                          name="current_password"
                          control={passwordControl}
                          rules={{ required: 'Mot de passe actuel requis' }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Mot de passe actuel"
                              type="password"
                              error={!!passwordErrors.current_password}
                              helperText={passwordErrors.current_password?.message}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="new_password"
                          control={passwordControl}
                          rules={{
                            required: 'Nouveau mot de passe requis',
                            minLength: {
                              value: 6,
                              message: 'Minimum 6 caractères',
                            },
                          }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Nouveau mot de passe"
                              type="password"
                              error={!!passwordErrors.new_password}
                              helperText={passwordErrors.new_password?.message}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Controller
                          name="confirm_password"
                          control={passwordControl}
                          rules={{
                            required: 'Confirmation requise',
                            validate: (value, { new_password }) =>
                              value === new_password || 'Les mots de passe ne correspondent pas',
                          }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Confirmer le mot de passe"
                              type="password"
                              error={!!passwordErrors.confirm_password}
                              helperText={passwordErrors.confirm_password?.message}
                            />
                          )}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Box display="flex" gap={2} justifyContent="flex-end">
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setShowPasswordForm(false)
                              resetPassword()
                            }}
                          >
                            Annuler
                          </Button>
                          <Button
                            type="submit"
                            variant="contained"
                            startIcon={<Save />}
                            disabled={updatePasswordMutation.isLoading}
                          >
                            {updatePasswordMutation.isLoading ? 'Modification...' : 'Modifier'}
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ProfilePage
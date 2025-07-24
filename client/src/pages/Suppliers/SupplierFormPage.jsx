import React, { useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
} from '@mui/material'
import { Save, ArrowBack } from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from 'react-query'

import { suppliersAPI } from '../../services/api'
import LoadingSpinner from '../../components/Common/LoadingSpinner'

const SupplierFormPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const queryClient = useQueryClient()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      contact_person: '',
    },
  })

  // Récupérer le fournisseur si modification
  const { data: supplier, isLoading: supplierLoading } = useQuery(
    ['supplier', id],
    () => suppliersAPI.getById(id),
    {
      enabled: isEdit,
      onSuccess: (data) => {
        reset(data.data)
      },
    }
  )

  // Mutation pour créer/modifier
  const mutation = useMutation(
    (data) => isEdit ? suppliersAPI.update(id, data) : suppliersAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('suppliers')
        navigate('/suppliers')
      },
    }
  )

  const onSubmit = (data) => {
    mutation.mutate(data)
  }

  if (isEdit && supplierLoading) {
    return <LoadingSpinner message="Chargement du fournisseur..." />
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/suppliers')}
          sx={{ mr: 2 }}
        >
          Retour
        </Button>
        <Typography variant="h4" fontWeight="bold">
          {isEdit ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
        </Typography>
      </Box>

      <Card>
        <CardContent>
          {mutation.error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {mutation.error.response?.data?.message || 'Une erreur est survenue'}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Nom requis' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Nom du fournisseur"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="contact_person"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Personne de contact"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Email invalide',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      type="email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Téléphone"
                      type="tel"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Adresse"
                      multiline
                      rows={3}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/suppliers')}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={mutation.isLoading}
                  >
                    {mutation.isLoading
                      ? (isEdit ? 'Modification...' : 'Création...')
                      : (isEdit ? 'Modifier' : 'Créer')
                    }
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default SupplierFormPage
import React, { useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  InputAdornment,
} from '@mui/material'
import { Save, ArrowBack } from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from 'react-query'

import { productsAPI, suppliersAPI } from '../../services/api'
import LoadingSpinner from '../../components/Common/LoadingSpinner'

const ProductFormPage = () => {
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
      description: '',
      sku: '',
      barcode: '',
      category: '',
      unit: 'pièce',
      purchase_price: 0,
      selling_price: 0,
      min_stock: 0,
      max_stock: 1000,
      current_stock: 0,
      image_url: '',
      supplier_id: '',
    },
  })

  // Récupérer le produit si modification
  const { data: product, isLoading: productLoading } = useQuery(
    ['product', id],
    () => productsAPI.getById(id),
    {
      enabled: isEdit,
      onSuccess: (data) => {
        reset(data.data)
      },
    }
  )

  // Récupérer les fournisseurs
  const { data: suppliersData } = useQuery(
    'suppliers-list',
    () => suppliersAPI.getAll({ limit: 100 })
  )

  // Récupérer les catégories
  const { data: categories = [] } = useQuery(
    'product-categories',
    productsAPI.getCategories
  )

  // Mutation pour créer/modifier
  const mutation = useMutation(
    (data) => isEdit ? productsAPI.update(id, data) : productsAPI.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products')
        navigate('/products')
      },
    }
  )

  const onSubmit = (data) => {
    // Convertir les chaînes en nombres
    const formattedData = {
      ...data,
      purchase_price: parseFloat(data.purchase_price) || 0,
      selling_price: parseFloat(data.selling_price) || 0,
      min_stock: parseInt(data.min_stock) || 0,
      max_stock: parseInt(data.max_stock) || 1000,
      current_stock: parseInt(data.current_stock) || 0,
      supplier_id: data.supplier_id || null,
    }

    mutation.mutate(formattedData)
  }

  if (isEdit && productLoading) {
    return <LoadingSpinner message="Chargement du produit..." />
  }

  const suppliers = suppliersData?.data?.suppliers || []

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/products')}
          sx={{ mr: 2 }}
        >
          Retour
        </Button>
        <Typography variant="h4" fontWeight="bold">
          {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
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
              {/* Informations générales */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Informations générales
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Nom requis' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Nom du produit"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="sku"
                  control={control}
                  rules={{ required: 'SKU requis' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="SKU"
                      error={!!errors.sku}
                      helperText={errors.sku?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description"
                      multiline
                      rows={3}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="barcode"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Code-barres"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Catégorie"
                      select
                    >
                      <MenuItem value="">Aucune catégorie</MenuItem>
                      {categories.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              {/* Prix et stock */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Prix et stock
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="unit"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Unité"
                      select
                    >
                      <MenuItem value="pièce">Pièce</MenuItem>
                      <MenuItem value="kg">Kilogramme</MenuItem>
                      <MenuItem value="litre">Litre</MenuItem>
                      <MenuItem value="mètre">Mètre</MenuItem>
                      <MenuItem value="lot">Lot</MenuItem>
                      <MenuItem value="pack">Pack</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="purchase_price"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Prix d'achat"
                      type="number"
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">€</InputAdornment>,
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="selling_price"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Prix de vente"
                      type="number"
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">€</InputAdornment>,
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="current_stock"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Stock actuel"
                      type="number"
                      inputProps={{ min: 0 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="min_stock"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Stock minimum"
                      type="number"
                      inputProps={{ min: 0 }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="max_stock"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Stock maximum"
                      type="number"
                      inputProps={{ min: 1 }}
                    />
                  )}
                />
              </Grid>

              {/* Fournisseur et image */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Autres informations
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="supplier_id"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Fournisseur</InputLabel>
                      <Select
                        {...field}
                        label="Fournisseur"
                      >
                        <MenuItem value="">Aucun fournisseur</MenuItem>
                        {suppliers.map((supplier) => (
                          <MenuItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="image_url"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="URL de l'image"
                      type="url"
                    />
                  )}
                />
              </Grid>

              {/* Boutons */}
              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/products')}
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

export default ProductFormPage
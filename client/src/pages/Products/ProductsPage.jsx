import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material'
import {
  Add,
  Search,
  MoreVert,
  Edit,
  Delete,
  Inventory,
  Warning,
  CheckCircle,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'

import { productsAPI } from '../../services/api'
import LoadingSpinner from '../../components/Common/LoadingSpinner'

const ProductsPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(false)

  // Récupérer les produits
  const { data: productsData, isLoading } = useQuery(
    ['products', { page, search, category }],
    () => productsAPI.getAll({ page, limit: 12, search, category }),
    {
      keepPreviousData: true,
    }
  )

  // Récupérer les catégories
  const { data: categories = [] } = useQuery(
    'product-categories',
    productsAPI.getCategories
  )

  // Mutation pour supprimer un produit
  const deleteMutation = useMutation(productsAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('products')
      setDeleteDialog(false)
      setSelectedProduct(null)
    },
  })

  const handleMenuClick = (event, product) => {
    setAnchorEl(event.currentTarget)
    setSelectedProduct(product)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedProduct(null)
  }

  const handleEdit = () => {
    navigate(`/products/${selectedProduct.id}/edit`)
    handleMenuClose()
  }

  const handleDelete = () => {
    setDeleteDialog(true)
    handleMenuClose()
  }

  const confirmDelete = () => {
    if (selectedProduct) {
      deleteMutation.mutate(selectedProduct.id)
    }
  }

  const getStockStatus = (product) => {
    if (product.current_stock === 0) {
      return { label: 'Rupture', color: 'error', icon: <Warning /> }
    } else if (product.current_stock <= product.min_stock) {
      return { label: 'Stock faible', color: 'warning', icon: <Warning /> }
    } else {
      return { label: 'En stock', color: 'success', icon: <CheckCircle /> }
    }
  }

  if (isLoading) {
    return <LoadingSpinner message="Chargement des produits..." />
  }

  const products = productsData?.data?.products || []

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Produits
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/products/new')}
        >
          Nouveau produit
        </Button>
      </Box>

      {/* Filtres */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Rechercher par nom ou SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Catégorie</InputLabel>
                <Select
                  value={category}
                  label="Catégorie"
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <MenuItem value="">Toutes les catégories</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearch('')
                  setCategory('')
                }}
              >
                Réinitialiser
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Liste des produits */}
      {products.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Inventory sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucun produit trouvé
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {search || category
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par ajouter votre premier produit'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/products/new')}
            >
              Ajouter un produit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {products.map((product) => {
            const stockStatus = getStockStatus(product)
            
            return (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" fontWeight="bold" noWrap>
                        {product.name}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, product)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      SKU: {product.sku}
                    </Typography>

                    {product.category && (
                      <Chip
                        label={product.category}
                        size="small"
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                    )}

                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="body2">
                        Prix d'achat: <strong>{product.purchase_price} €</strong>
                      </Typography>
                      <Typography variant="body2">
                        Prix de vente: <strong>{product.selling_price} €</strong>
                      </Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">
                        Stock: <strong>{product.current_stock}</strong> {product.unit}
                      </Typography>
                      <Chip
                        label={stockStatus.label}
                        color={stockStatus.color}
                        size="small"
                        icon={stockStatus.icon}
                      />
                    </Box>

                    {product.supplier_name && (
                      <Typography variant="caption" color="text.secondary" mt={1} display="block">
                        Fournisseur: {product.supplier_name}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      {/* Menu contextuel */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1 }} />
          Modifier
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Supprimer
        </MenuItem>
      </Menu>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le produit "{selectedProduct?.name}" ?
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Annuler</Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ProductsPage
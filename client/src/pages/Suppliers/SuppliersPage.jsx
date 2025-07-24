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
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  InputAdornment,
  Chip,
} from '@mui/material'
import {
  Add,
  Search,
  MoreVert,
  Edit,
  Delete,
  Business,
  Email,
  Phone,
  LocationOn,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'

import { suppliersAPI } from '../../services/api'
import LoadingSpinner from '../../components/Common/LoadingSpinner'

const SuppliersPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(false)

  // Récupérer les fournisseurs
  const { data: suppliersData, isLoading } = useQuery(
    ['suppliers', { page, search }],
    () => suppliersAPI.getAll({ page, limit: 12, search }),
    {
      keepPreviousData: true,
    }
  )

  // Mutation pour supprimer un fournisseur
  const deleteMutation = useMutation(suppliersAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('suppliers')
      setDeleteDialog(false)
      setSelectedSupplier(null)
    },
  })

  const handleMenuClick = (event, supplier) => {
    setAnchorEl(event.currentTarget)
    setSelectedSupplier(supplier)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedSupplier(null)
  }

  const handleEdit = () => {
    navigate(`/suppliers/${selectedSupplier.id}/edit`)
    handleMenuClose()
  }

  const handleDelete = () => {
    setDeleteDialog(true)
    handleMenuClose()
  }

  const confirmDelete = () => {
    if (selectedSupplier) {
      deleteMutation.mutate(selectedSupplier.id)
    }
  }

  if (isLoading) {
    return <LoadingSpinner message="Chargement des fournisseurs..." />
  }

  const suppliers = suppliersData?.data?.suppliers || []

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Fournisseurs
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/suppliers/new')}
        >
          Nouveau fournisseur
        </Button>
      </Box>

      {/* Filtres */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Rechercher par nom ou email..."
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
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setSearch('')}
              >
                Réinitialiser
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Liste des fournisseurs */}
      {suppliers.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucun fournisseur trouvé
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {search
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par ajouter votre premier fournisseur'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/suppliers/new')}
            >
              Ajouter un fournisseur
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {suppliers.map((supplier) => (
            <Grid item xs={12} sm={6} md={4} key={supplier.id}>
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
                      {supplier.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, supplier)}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>

                  {supplier.email && (
                    <Box display="flex" alignItems="center" mb={1}>
                      <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {supplier.email}
                      </Typography>
                    </Box>
                  )}

                  {supplier.phone && (
                    <Box display="flex" alignItems="center" mb={1}>
                      <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {supplier.phone}
                      </Typography>
                    </Box>
                  )}

                  {supplier.address && (
                    <Box display="flex" alignItems="flex-start" mb={2}>
                      <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary', mt: 0.2 }} />
                      <Typography variant="body2" color="text.secondary">
                        {supplier.address}
                      </Typography>
                    </Box>
                  )}

                  {supplier.contact_person && (
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        Contact: {supplier.contact_person}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
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
            Êtes-vous sûr de vouloir supprimer le fournisseur "{selectedSupplier?.name}" ?
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

export default SuppliersPage
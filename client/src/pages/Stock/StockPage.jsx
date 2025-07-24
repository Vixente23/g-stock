import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  InputAdornment,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Add,
  Search,
  TrendingUp,
  TrendingDown,
  Warning,
  Inventory,
  History,
  Notifications,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm, Controller } from 'react-hook-form'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

import { stockAPI, productsAPI } from '../../services/api'
import LoadingSpinner from '../../components/Common/LoadingSpinner'

const StockPage = () => {
  const queryClient = useQueryClient()
  const [tabValue, setTabValue] = useState(0)
  const [movementDialog, setMovementDialog] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      product_id: '',
      type: 'entree',
      quantity: '',
      reason: '',
      reference: '',
      notes: '',
    },
  })

  // Récupérer les mouvements de stock
  const { data: movementsData, isLoading: movementsLoading } = useQuery(
    ['stock-movements', { search }],
    () => stockAPI.getMovements({ search, limit: 50 }),
    {
      refetchInterval: 30000,
    }
  )

  // Récupérer les alertes
  const { data: alerts = [], isLoading: alertsLoading } = useQuery(
    'stock-alerts',
    () => stockAPI.getAlerts({ is_read: false }),
    {
      refetchInterval: 30000,
    }
  )

  // Récupérer les produits en stock faible
  const { data: lowStockProducts = [], isLoading: lowStockLoading } = useQuery(
    'low-stock-products',
    stockAPI.getLowStock,
    {
      refetchInterval: 60000,
    }
  )

  // Récupérer les produits pour le formulaire
  const { data: productsData } = useQuery(
    'products-for-movement',
    () => productsAPI.getAll({ limit: 1000 })
  )

  // Mutation pour créer un mouvement
  const createMovementMutation = useMutation(stockAPI.createMovement, {
    onSuccess: () => {
      queryClient.invalidateQueries('stock-movements')
      queryClient.invalidateQueries('products')
      queryClient.invalidateQueries('dashboard-stats')
      setMovementDialog(false)
      reset()
      setSelectedProduct(null)
    },
  })

  // Mutation pour marquer une alerte comme lue
  const markAlertReadMutation = useMutation(stockAPI.markAlertAsRead, {
    onSuccess: () => {
      queryClient.invalidateQueries('stock-alerts')
      queryClient.invalidateQueries('dashboard-alerts')
    },
  })

  const handleCreateMovement = (data) => {
    const formattedData = {
      ...data,
      quantity: parseInt(data.quantity),
      product_id: parseInt(data.product_id),
    }
    createMovementMutation.mutate(formattedData)
  }

  const handleMarkAlertRead = (alertId) => {
    markAlertReadMutation.mutate(alertId)
  }

  const getMovementTypeLabel = (type) => {
    const types = {
      entree: 'Entrée',
      sortie: 'Sortie',
      ajustement: 'Ajustement',
      inventaire: 'Inventaire'
    }
    return types[type] || type
  }

  const getMovementTypeColor = (type) => {
    switch (type) {
      case 'entree': return 'success'
      case 'sortie': return 'error'
      case 'ajustement': return 'warning'
      case 'inventaire': return 'info'
      default: return 'default'
    }
  }

  const getMovementIcon = (type) => {
    switch (type) {
      case 'entree': return <TrendingUp />
      case 'sortie': return <TrendingDown />
      case 'ajustement': return <Warning />
      case 'inventaire': return <Inventory />
      default: return <Inventory />
    }
  }

  const getStockStatus = (product) => {
    if (product.current_stock === 0) {
      return { label: 'Rupture', color: 'error' }
    } else if (product.current_stock <= product.min_stock) {
      return { label: 'Stock faible', color: 'warning' }
    } else {
      return { label: 'En stock', color: 'success' }
    }
  }

  const products = productsData?.data?.products || []
  const movements = movementsData?.data?.movements || []

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Gestion du Stock
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setMovementDialog(true)}
        >
          Nouveau mouvement
        </Button>
      </Box>

      {/* Onglets */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="fullWidth"
        >
          <Tab icon={<History />} label="Mouvements" />
          <Tab icon={<Notifications />} label={`Alertes (${alerts.length})`} />
          <Tab icon={<Warning />} label="Stock faible" />
        </Tabs>
      </Card>

      {/* Onglet Mouvements */}
      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight="bold">
                Historique des mouvements
              </Typography>
              <TextField
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 300 }}
              />
            </Box>

            {movementsLoading ? (
              <LoadingSpinner />
            ) : movements.length === 0 ? (
              <Alert severity="info">
                Aucun mouvement de stock trouvé
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Produit</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Quantité</TableCell>
                      <TableCell align="right">Stock avant</TableCell>
                      <TableCell align="right">Stock après</TableCell>
                      <TableCell>Utilisateur</TableCell>
                      <TableCell>Raison</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {movement.product_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              SKU: {movement.sku}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getMovementIcon(movement.type)}
                            label={getMovementTypeLabel(movement.type)}
                            color={getMovementTypeColor(movement.type)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            color={movement.type === 'sortie' ? 'error.main' : 'success.main'}
                            fontWeight="bold"
                          >
                            {movement.type === 'sortie' ? '-' : '+'}{Math.abs(movement.quantity)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{movement.previous_stock}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {movement.new_stock}
                        </TableCell>
                        <TableCell>
                          {movement.first_name} {movement.last_name}
                        </TableCell>
                        <TableCell>{movement.reason || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Onglet Alertes */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Alertes de stock
            </Typography>

            {alertsLoading ? (
              <LoadingSpinner />
            ) : alerts.length === 0 ? (
              <Alert severity="success">
                Aucune alerte en cours
              </Alert>
            ) : (
              <Box>
                {alerts.map((alert) => (
                  <Alert
                    key={alert.id}
                    severity={alert.type === 'rupture' ? 'error' : 'warning'}
                    sx={{ mb: 2 }}
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        onClick={() => handleMarkAlertRead(alert.id)}
                      >
                        Marquer comme lu
                      </Button>
                    }
                  >
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {alert.message}
                      </Typography>
                      <Typography variant="caption">
                        {format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </Typography>
                    </Box>
                  </Alert>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Onglet Stock faible */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Produits en stock faible
            </Typography>

            {lowStockLoading ? (
              <LoadingSpinner />
            ) : lowStockProducts.length === 0 ? (
              <Alert severity="success">
                Aucun produit en stock faible
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {lowStockProducts.map((product) => {
                  const status = getStockStatus(product)
                  return (
                    <Grid item xs={12} md={6} key={product.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                            <Box>
                              <Typography variant="h6" fontWeight="bold">
                                {product.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                SKU: {product.sku}
                              </Typography>
                            </Box>
                            <Chip
                              label={status.label}
                              color={status.color}
                              size="small"
                            />
                          </Box>

                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">
                              Stock actuel: <strong>{product.current_stock}</strong>
                            </Typography>
                            <Typography variant="body2">
                              Stock min: <strong>{product.min_stock}</strong>
                            </Typography>
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
          </CardContent>
        </Card>
      </TabPanel>

      {/* Dialog nouveau mouvement */}
      <Dialog
        open={movementDialog}
        onClose={() => setMovementDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nouveau mouvement de stock</DialogTitle>
        <DialogContent>
          {createMovementMutation.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createMovementMutation.error.response?.data?.message || 'Une erreur est survenue'}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(handleCreateMovement)} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="product_id"
                  control={control}
                  rules={{ required: 'Produit requis' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.product_id}>
                      <InputLabel>Produit</InputLabel>
                      <Select
                        {...field}
                        label="Produit"
                        onChange={(e) => {
                          field.onChange(e)
                          const product = products.find(p => p.id === e.target.value)
                          setSelectedProduct(product)
                        }}
                      >
                        {products.map((product) => (
                          <MenuItem key={product.id} value={product.id}>
                            {product.name} (Stock: {product.current_stock})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Type de mouvement</InputLabel>
                      <Select {...field} label="Type de mouvement">
                        <MenuItem value="entree">Entrée</MenuItem>
                        <MenuItem value="sortie">Sortie</MenuItem>
                        <MenuItem value="ajustement">Ajustement</MenuItem>
                        <MenuItem value="inventaire">Inventaire</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="quantity"
                  control={control}
                  rules={{ 
                    required: 'Quantité requise',
                    min: { value: 1, message: 'Quantité minimum: 1' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Quantité"
                      type="number"
                      inputProps={{ min: 1 }}
                      error={!!errors.quantity}
                      helperText={errors.quantity?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="reason"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Raison"
                      placeholder="Ex: Vente, Réapprovisionnement..."
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="reference"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Référence"
                      placeholder="Ex: BON-001, FAC-123..."
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Notes"
                      multiline
                      rows={2}
                      placeholder="Notes additionnelles..."
                    />
                  )}
                />
              </Grid>

              {selectedProduct && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Stock actuel de "{selectedProduct.name}": {selectedProduct.current_stock} {selectedProduct.unit}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMovementDialog(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit(handleCreateMovement)}
            variant="contained"
            disabled={createMovementMutation.isLoading}
          >
            {createMovementMutation.isLoading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default StockPage
import React from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Paper,
  Alert,
} from '@mui/material'
import {
  Inventory,
  Business,
  Warning,
  TrendingUp,
  TrendingDown,
  Notifications,
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

import { dashboardAPI } from '../../services/api'
import LoadingSpinner from '../../components/Common/LoadingSpinner'
import StatsCard from './components/StatsCard'
import RecentActivity from './components/RecentActivity'
import StockChart from './components/StockChart'

const DashboardPage = () => {
  const { data: stats, isLoading: statsLoading } = useQuery(
    'dashboard-stats',
    dashboardAPI.getStats,
    {
      refetchInterval: 60000, // Rafraîchir chaque minute
    }
  )

  const { data: alerts = [], isLoading: alertsLoading } = useQuery(
    'dashboard-alerts',
    dashboardAPI.getAlerts,
    {
      refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
    }
  )

  if (statsLoading) {
    return <LoadingSpinner message="Chargement du tableau de bord..." />
  }

  const getMovementTypeLabel = (type) => {
    const types = {
      entree: 'Entrées',
      sortie: 'Sorties',
      ajustement: 'Ajustements',
      inventaire: 'Inventaires'
    }
    return types[type] || type
  }

  const getAlertColor = (type) => {
    switch (type) {
      case 'stock_faible': return 'warning'
      case 'rupture': return 'error'
      case 'peremption': return 'info'
      default: return 'default'
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Tableau de bord
      </Typography>

      {/* Statistiques principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Produits"
            value={stats?.overview?.totalProducts || 0}
            icon={<Inventory />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Fournisseurs"
            value={stats?.overview?.totalSuppliers || 0}
            icon={<Business />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Stock faible"
            value={stats?.overview?.lowStockProducts || 0}
            icon={<Warning />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Valeur stock"
            value={`${(stats?.overview?.totalStockValue || 0).toLocaleString('fr-FR')} €`}
            icon={<TrendingUp />}
            color="success"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Alertes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Notifications color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  Alertes récentes
                </Typography>
              </Box>

              {alertsLoading ? (
                <Typography>Chargement...</Typography>
              ) : alerts.length === 0 ? (
                <Alert severity="success">
                  Aucune alerte en cours
                </Alert>
              ) : (
                <List dense>
                  {alerts.slice(0, 5).map((alert) => (
                    <ListItem key={alert.id} divider>
                      <ListItemIcon>
                        <Warning color={getAlertColor(alert.type)} />
                      </ListItemIcon>
                      <ListItemText
                        primary={alert.message}
                        secondary={format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      />
                      <Chip
                        label={alert.type.replace('_', ' ')}
                        size="small"
                        color={getAlertColor(alert.type)}
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Mouvements récents */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Mouvements récents (7 jours)
              </Typography>

              {stats?.recentMovements && Object.keys(stats.recentMovements).length > 0 ? (
                <Box>
                  {Object.entries(stats.recentMovements).map(([type, count]) => (
                    <Box
                      key={type}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      py={1}
                    >
                      <Box display="flex" alignItems="center">
                        {type === 'entree' && <TrendingUp color="success" sx={{ mr: 1 }} />}
                        {type === 'sortie' && <TrendingDown color="error" sx={{ mr: 1 }} />}
                        {type === 'ajustement' && <Warning color="warning" sx={{ mr: 1 }} />}
                        {type === 'inventaire' && <Inventory color="info" sx={{ mr: 1 }} />}
                        <Typography>{getMovementTypeLabel(type)}</Typography>
                      </Box>
                      <Chip label={count} color="primary" size="small" />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">
                  Aucun mouvement récent
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top produits */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Produits les plus vendus (ce mois)
              </Typography>

              {stats?.topProducts?.length > 0 ? (
                <List dense>
                  {stats.topProducts.map((product, index) => (
                    <ListItem key={product.sku} divider>
                      <ListItemText
                        primary={`${index + 1}. ${product.name}`}
                        secondary={`SKU: ${product.sku}`}
                      />
                      <Chip
                        label={`${product.total_sold} vendus`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  Aucune vente ce mois
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Stock par catégorie */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Stock par catégorie
              </Typography>

              {stats?.stockByCategory?.length > 0 ? (
                <List dense>
                  {stats.stockByCategory.slice(0, 5).map((category) => (
                    <ListItem key={category.category} divider>
                      <ListItemText
                        primary={category.category}
                        secondary={`${category.product_count} produits`}
                      />
                      <Box textAlign="right">
                        <Typography variant="body2" fontWeight="bold">
                          {category.total_value?.toLocaleString('fr-FR')} €
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {category.total_stock} unités
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  Aucune donnée disponible
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Activité récente */}
        <Grid item xs={12}>
          <RecentActivity activities={stats?.recentActivity || []} />
        </Grid>
      </Grid>
    </Box>
  )
}

export default DashboardPage
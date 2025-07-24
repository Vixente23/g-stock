import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Box,
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  Warning,
  Inventory,
} from '@mui/icons-material'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const RecentActivity = ({ activities }) => {
  const getMovementIcon = (type) => {
    switch (type) {
      case 'entree': return <TrendingUp color="success" />
      case 'sortie': return <TrendingDown color="error" />
      case 'ajustement': return <Warning color="warning" />
      case 'inventaire': return <Inventory color="info" />
      default: return <Inventory />
    }
  }

  const getMovementColor = (type) => {
    switch (type) {
      case 'entree': return 'success'
      case 'sortie': return 'error'
      case 'ajustement': return 'warning'
      case 'inventaire': return 'info'
      default: return 'default'
    }
  }

  const getMovementLabel = (type) => {
    const types = {
      entree: 'Entrée',
      sortie: 'Sortie',
      ajustement: 'Ajustement',
      inventaire: 'Inventaire'
    }
    return types[type] || type
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Activité récente
        </Typography>

        {activities.length === 0 ? (
          <Typography color="text.secondary">
            Aucune activité récente
          </Typography>
        ) : (
          <List>
            {activities.map((activity) => (
              <ListItem key={activity.id} divider>
                <ListItemIcon>
                  {getMovementIcon(activity.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1">
                        {activity.product_name}
                      </Typography>
                      <Chip
                        label={getMovementLabel(activity.type)}
                        size="small"
                        color={getMovementColor(activity.type)}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Quantité: {Math.abs(activity.quantity)} • 
                        Par: {activity.first_name} {activity.last_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(activity.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </Typography>
                    </Box>
                  }
                />
                <Box textAlign="right">
                  <Typography variant="body2" fontWeight="bold">
                    Stock: {activity.new_stock}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    (était: {activity.previous_stock})
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentActivity
import React from 'react'
import { Card, CardContent, Box, Typography, useTheme } from '@mui/material'

const StatsCard = ({ title, value, icon, color = 'primary' }) => {
  const theme = useTheme()

  const getColor = () => {
    switch (color) {
      case 'primary': return theme.palette.primary.main
      case 'secondary': return theme.palette.secondary.main
      case 'success': return theme.palette.success.main
      case 'warning': return theme.palette.warning.main
      case 'error': return theme.palette.error.main
      case 'info': return theme.palette.info.main
      default: return theme.palette.primary.main
    }
  }

  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${getColor()}15 0%, ${getColor()}05 100%)`,
        border: `1px solid ${getColor()}20`,
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold" color={getColor()}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              {title}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: `${getColor()}20`,
              color: getColor(),
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default StatsCard
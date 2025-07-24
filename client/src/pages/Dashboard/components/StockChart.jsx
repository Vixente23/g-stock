import React from 'react'
import { Card, CardContent, Typography, Box } from '@mui/material'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = ['#152046', '#96a4d3', '#aa8f76', '#38a169', '#dd6b20', '#e53e3e']

const StockChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Répartition du stock
          </Typography>
          <Typography color="text.secondary">
            Aucune donnée disponible
          </Typography>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((item, index) => ({
    name: item.category,
    value: parseFloat(item.total_value),
    count: item.product_count,
    color: COLORS[index % COLORS.length]
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <Box
          sx={{
            backgroundColor: 'white',
            p: 2,
            border: '1px solid #ccc',
            borderRadius: 1,
            boxShadow: 2,
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {data.name}
          </Typography>
          <Typography variant="body2">
            Valeur: {data.value.toLocaleString('fr-FR')} €
          </Typography>
          <Typography variant="body2">
            Produits: {data.count}
          </Typography>
        </Box>
      )
    }
    return null
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Répartition du stock par catégorie
        </Typography>
        <Box height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  )
}

export default StockChart
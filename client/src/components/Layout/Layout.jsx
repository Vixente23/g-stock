import React, { useState } from 'react'
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard,
  Inventory,
  MoveToInbox,
  Business,
  People,
  AccountCircle,
  Logout,
  Notifications,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from 'react-query'

import { useAuth } from '../../contexts/AuthContext'
import { dashboardAPI } from '../../services/api'

const drawerWidth = 280

const Layout = ({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)

  // Récupérer les alertes non lues
  const { data: alerts = [] } = useQuery(
    'dashboard-alerts',
    dashboardAPI.getAlerts,
    {
      refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
    }
  )

  const menuItems = [
    { text: 'Tableau de bord', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Produits', icon: <Inventory />, path: '/products' },
    { text: 'Stock', icon: <MoveToInbox />, path: '/stock' },
    { text: 'Fournisseurs', icon: <Business />, path: '/suppliers' },
    ...(user?.role === 'admin' ? [
      { text: 'Utilisateurs', icon: <People />, path: '/users' }
    ] : []),
  ]

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    handleMenuClose()
  }

  const handleProfile = () => {
    navigate('/profile')
    handleMenuClose()
  }

  const drawer = (
    <Box>
      <Box
        sx={{
          p: 2,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          StockApp
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Gestion de stock
        </Typography>
      </Box>

      <List sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                navigate(item.path)
                if (isMobile) setMobileOpen(false)
              }}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.light + '20',
                  color: theme.palette.primary.main,
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: 'text.primary',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'StockApp'}
          </Typography>

          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Badge badgeContent={alerts.length} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <IconButton onClick={handleMenuClick} color="inherit">
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: theme.palette.primary.main,
                fontSize: '0.875rem',
              }}
            >
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleProfile}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              Profil
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Déconnexion
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: theme.palette.background.default,
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export default Layout
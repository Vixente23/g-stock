import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Alert,
} from '@mui/material'
import {
  MoreVert,
  Edit,
  PersonOff,
  PersonAdd,
  Add,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm, Controller } from 'react-hook-form'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

import { usersAPI, authAPI } from '../../services/api'
import LoadingSpinner from '../../components/Common/LoadingSpinner'

const UsersPage = () => {
  const queryClient = useQueryClient()
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDialog, setUserDialog] = useState(false)
  const [isEdit, setIsEdit] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      role: 'magasinier',
    },
  })

  // Récupérer les utilisateurs
  const { data: users = [], isLoading } = useQuery('users', usersAPI.getAll)

  // Mutation pour créer un utilisateur
  const createUserMutation = useMutation(authAPI.register, {
    onSuccess: () => {
      queryClient.invalidateQueries('users')
      setUserDialog(false)
      reset()
    },
  })

  // Mutation pour modifier un utilisateur
  const updateUserMutation = useMutation(
    ({ id, data }) => usersAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users')
        setUserDialog(false)
        reset()
      },
    }
  )

  // Mutation pour désactiver/activer un utilisateur
  const toggleUserMutation = useMutation(
    ({ id, action }) => action === 'deactivate' 
      ? usersAPI.deactivate(id) 
      : usersAPI.activate(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users')
        setAnchorEl(null)
        setSelectedUser(null)
      },
    }
  )

  const handleMenuClick = (event, user) => {
    setAnchorEl(event.currentTarget)
    setSelectedUser(user)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedUser(null)
  }

  const handleEdit = () => {
    setIsEdit(true)
    reset({
      email: selectedUser.email,
      first_name: selectedUser.first_name,
      last_name: selectedUser.last_name,
      role: selectedUser.role,
    })
    setUserDialog(true)
    handleMenuClose()
  }

  const handleToggleStatus = () => {
    const action = selectedUser.is_active ? 'deactivate' : 'activate'
    toggleUserMutation.mutate({ id: selectedUser.id, action })
  }

  const handleNewUser = () => {
    setIsEdit(false)
    reset({
      email: '',
      first_name: '',
      last_name: '',
      role: 'magasinier',
    })
    setUserDialog(true)
  }

  const onSubmit = (data) => {
    if (isEdit) {
      updateUserMutation.mutate({ id: selectedUser.id, data })
    } else {
      createUserMutation.mutate({ ...data, password: 'password123' })
    }
  }

  const getRoleLabel = (role) => {
    const roles = {
      admin: 'Administrateur',
      magasinier: 'Magasinier',
      commercial: 'Commercial'
    }
    return roles[role] || role
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error'
      case 'magasinier': return 'primary'
      case 'commercial': return 'success'
      default: return 'default'
    }
  }

  if (isLoading) {
    return <LoadingSpinner message="Chargement des utilisateurs..." />
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Utilisateurs
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleNewUser}
        >
          Nouvel utilisateur
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rôle</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Créé le</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {user.first_name} {user.last_name}
                      </Typography>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleLabel(user.role)}
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? 'Actif' : 'Inactif'}
                        color={user.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuClick(e, user)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

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
        <MenuItem onClick={handleToggleStatus}>
          {selectedUser?.is_active ? (
            <>
              <PersonOff sx={{ mr: 1 }} />
              Désactiver
            </>
          ) : (
            <>
              <PersonAdd sx={{ mr: 1 }} />
              Activer
            </>
          )}
        </MenuItem>
      </Menu>

      {/* Dialog utilisateur */}
      <Dialog
        open={userDialog}
        onClose={() => setUserDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        </DialogTitle>
        <DialogContent>
          {(createUserMutation.error || updateUserMutation.error) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createUserMutation.error?.response?.data?.message || 
               updateUserMutation.error?.response?.data?.message || 
               'Une erreur est survenue'}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="first_name"
                  control={control}
                  rules={{ required: 'Prénom requis' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Prénom"
                      error={!!errors.first_name}
                      helperText={errors.first_name?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="last_name"
                  control={control}
                  rules={{ required: 'Nom requis' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Nom"
                      error={!!errors.last_name}
                      helperText={errors.last_name?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    required: 'Email requis',
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

              <Grid item xs={12}>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Rôle</InputLabel>
                      <Select {...field} label="Rôle">
                        <MenuItem value="admin">Administrateur</MenuItem>
                        <MenuItem value="magasinier">Magasinier</MenuItem>
                        <MenuItem value="commercial">Commercial</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {!isEdit && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Le mot de passe par défaut sera "password123". 
                    L'utilisateur pourra le changer dans son profil.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={createUserMutation.isLoading || updateUserMutation.isLoading}
          >
            {createUserMutation.isLoading || updateUserMutation.isLoading
              ? (isEdit ? 'Modification...' : 'Création...')
              : (isEdit ? 'Modifier' : 'Créer')
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UsersPage
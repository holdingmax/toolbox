import axios from 'axios'

// En dev: VITE_API_URL=http://localhost:3000 (definido en .env local)
// En prod: no se define → '' → axios usa rutas relativas al mismo servidor
const API_URL = import.meta.env.VITE_API_URL || ''

const client = axios.create({ baseURL: API_URL })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('toolbox_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  (error) => {
    // El 401 del login (credenciales inválidas), del reset-password (token
    // inválido/expirado) y del cambio de contraseña (contraseña actual
    // incorrecta) no son una sesión expirada — deben llegar tal cual a quien
    // hizo el request para que muestre su propio mensaje de error, sin
    // resetear la pantalla.
    const RUTAS_SIN_REDIRECT = ['/api/auth/login', '/api/auth/reset-password', '/api/auth/password']
    const esRutaPublica = RUTAS_SIN_REDIRECT.includes(error.config?.url)
    if (error.response?.status === 401 && !esRutaPublica) {
      localStorage.removeItem('toolbox_token')
      localStorage.removeItem('toolbox_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default client

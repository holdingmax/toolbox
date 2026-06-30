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
    if (error.response?.status === 401) {
      localStorage.removeItem('toolbox_token')
      localStorage.removeItem('toolbox_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default client

import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const api = axios.create({
  baseURL: 'https://unitask-production-5087.up.railway.app',
})

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    if (status === 401 || status === 403) {
      await AsyncStorage.removeItem('token')
      await AsyncStorage.removeItem('usuario')
    }
    return Promise.reject(error)
  }
)

export default api

import axios from 'axios'
import router from '../router/index'

axios.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status >= 500) {
      router.push('/500')
    }
    return Promise.reject(err)
  }
)

export default axios

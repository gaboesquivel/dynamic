import { useContext } from 'react'
import { VencuraContext } from '../provider'

export const useVencuraClient = () => {
  const context = useContext(VencuraContext)
  if (!context) {
    throw new Error('useVencuraClient must be used within VencuraProvider')
  }
  return context.client
}

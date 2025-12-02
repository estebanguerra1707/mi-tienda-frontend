import { ping } from '@/lib/ping'
import { useInactivityLogout } from './features/auth/useInactivityLogout'

export default function App() {
    useInactivityLogout();
  return <div className="p-6">Alias funcionando: {ping}</div>
}

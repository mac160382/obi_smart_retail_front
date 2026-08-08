import { BarChart3, Boxes, Home, LogOut, Sparkles, UploadCloud } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/store/authStore'

export function Sidebar() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((state) => state.clearSession)

  function handleLogout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="sidebar">
      <div>
        <div className="brand"><div className="brand-mark">M</div><div><strong>MAREA</strong><span>Hipermercados</span></div></div>
        <nav>
          <a href='#'><Home size={18}/>Panel General</a>
          <NavLink to='/dashboard'><Sparkles size={18}/>Seguimiento Semanal</NavLink>
          <a href='#'><BarChart3 size={18}/>Control de Inventario</a>
          <NavLink to='/imports'><UploadCloud size={18}/>Carga de archivos CSV</NavLink>
        </nav>
      </div>
      <div className="engine"><div><Boxes size={18}/><strong>OBI Smart</strong></div><small>Core Engine · PostgreSQL</small><span>● Servicio activo</span></div>
      <button className='logout-button' type='button' onClick={handleLogout}><LogOut size={17}/>Cerrar sesión</button>
    </aside>
  )
}

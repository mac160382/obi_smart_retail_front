import { BarChart3, Boxes, ChevronDown, Home, LogOut, Sparkles, UploadCloud, UserRound } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/store/authStore'

export function Sidebar() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((state) => state.clearSession)
  const username = useAuthStore((state) => state.session?.username || 'Usuario')

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
          <NavLink to='/dashboard'><Sparkles size={18}/>Resumen</NavLink>
          <NavLink to='/inventory'><BarChart3 size={18}/>Control de Inventario</NavLink>
          <NavLink to='/imports'><UploadCloud size={18}/>Carga de archivos CSV</NavLink>
        </nav>
      </div>
      <div className='sidebar-bottom'>
        <div className="engine"><div><Boxes size={18}/><strong>OBI Smart</strong></div><small>Core Engine · PostgreSQL</small><span>● Servicio activo</span></div>
        <details className='user-menu'>
          <summary>
            <span className='user-avatar'><UserRound size={18}/></span>
            <span className='user-identity'><small>Usuario registrado</small><strong>{username}</strong></span>
            <ChevronDown className='user-menu-chevron' size={17}/>
          </summary>
          <div className='user-menu-dropdown'>
            <button className='logout-button' type='button' onClick={handleLogout}><LogOut size={17}/>Cerrar sesión</button>
          </div>
        </details>
      </div>
    </aside>
  )
}

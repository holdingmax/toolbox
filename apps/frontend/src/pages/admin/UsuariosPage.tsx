import { useState, useEffect, useRef } from 'react'
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  toggleEstadoUsuario,
  getRoles,
  type UsuarioAdmin,
  type RolAdmin,
} from '../../api/admin.api'

// ── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  usuario: UsuarioAdmin | null
  roles: RolAdmin[]
  onClose: () => void
  onSaved: () => void
}

function UsuarioModal({ usuario, roles, onClose, onSaved }: ModalProps) {
  const isEdit = !!usuario
  const [nombre, setNombre] = useState(usuario?.nombre ?? '')
  const [email, setEmail] = useState(usuario?.email ?? '')
  const [password, setPassword] = useState('')
  const [rol_id, setRolId] = useState(usuario?.rol_id ?? roles[0]?.id ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!nombre.trim() || !email.trim() || (!isEdit && !password.trim()) || !rol_id) {
      setError('Completá todos los campos requeridos.')
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        const payload: Record<string, string> = { nombre, email, rol_id }
        if (password.trim()) payload.password = password
        await updateUsuario(usuario.id, payload)
      } else {
        await createUsuario({ nombre, email, password, rol_id })
      }
      onSaved()
      onClose()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? 'Ocurrió un error. Intentá de nuevo.'
      setError(Array.isArray(msg) ? msg.join(' · ') : msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-bg-card border border-border-card rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-card">
          <h2 className="text-text-primary font-semibold text-lg">
            {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-sm text-status-inactive bg-status-inactive/10 border border-status-inactive/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="block text-text-secondary text-sm mb-1">
              Nombre completo <span className="text-status-inactive">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-white/5 border border-border-card text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              placeholder="Ej: Juan García"
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1">
              Email <span className="text-status-inactive">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-border-card text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              placeholder="usuario@empresa.com"
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1">
              Contraseña{' '}
              {isEdit ? (
                <span className="text-text-secondary/50">(dejar vacío para no cambiar)</span>
              ) : (
                <span className="text-status-inactive">*</span>
              )}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-border-card text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm mb-1">
              Rol <span className="text-status-inactive">*</span>
            </label>
            <select
              value={rol_id}
              onChange={(e) => setRolId(e.target.value)}
              className="w-full bg-white/5 border border-border-card text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
            >
              {roles.filter((r) => r.activo).map((r) => (
                <option key={r.id} value={r.id} className="bg-bg-card">
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-accent hover:bg-accent-hover text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-text-secondary rounded-lg py-2 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-border-card">
          {Array.from({ length: 5 }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-white/5 rounded animate-pulse" style={{ width: j === 1 ? '80%' : '60%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([])
  const [roles, setRoles] = useState<RolAdmin[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 20
  const [buscar, setBuscar] = useState('')
  const [inputBuscar, setInputBuscar] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<UsuarioAdmin | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const searchRef = useRef<HTMLInputElement>(null)
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const fetchUsuarios = async () => {
    setLoading(true)
    try {
      const res = await getUsuarios({ page, limit, buscar: buscar || undefined })
      setUsuarios(res.data)
      setTotal(res.total)
    } catch {
      // error manejado por interceptor
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getRoles().then(setRoles).catch(() => {})
  }, [])

  useEffect(() => {
    fetchUsuarios()
  }, [page, buscar])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setBuscar(inputBuscar.trim())
  }

  const handleClearSearch = () => {
    setInputBuscar('')
    setBuscar('')
    setPage(1)
    searchRef.current?.focus()
  }

  const handleToggle = async (u: UsuarioAdmin) => {
    setTogglingId(u.id)
    try {
      const updated = await toggleEstadoUsuario(u.id)
      setUsuarios((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
    } catch {
      // error
    } finally {
      setTogglingId(null)
    }
  }

  const openCreate = () => {
    setEditando(null)
    setModalOpen(true)
  }

  const openEdit = (u: UsuarioAdmin) => {
    setEditando(u)
    setModalOpen(true)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">Usuarios</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {total} {total === 1 ? 'usuario registrado' : 'usuarios registrados'}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span>+</span>
          <span>Nuevo usuario</span>
        </button>
      </div>

      {/* Buscador */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <input
            ref={searchRef}
            type="text"
            value={inputBuscar}
            onChange={(e) => setInputBuscar(e.target.value)}
            placeholder="Buscar por nombre o email…"
            className="w-full bg-white/5 border border-border-card text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent pr-8"
          />
          {inputBuscar && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
        <button
          type="submit"
          className="bg-white/5 hover:bg-white/10 text-text-secondary px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Buscar
        </button>
      </form>

      {/* Tabla */}
      <div className="bg-bg-card border border-border-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 border-b border-border-card">
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Nombre</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Email</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Rol</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Estado</th>
              <th className="text-right px-4 py-3 text-text-secondary font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton />
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-text-secondary">
                  {buscar ? `Sin resultados para "${buscar}"` : 'No hay usuarios registrados'}
                </td>
              </tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id} className="border-b border-border-card hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3 text-text-primary font-medium">{u.nombre}</td>
                  <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-text-secondary text-xs bg-white/5 px-2 py-1 rounded-full">
                      {u.rol.nombre}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        u.activo
                          ? 'bg-status-active/20 text-status-active'
                          : 'bg-status-inactive/20 text-status-inactive'
                      }`}
                    >
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        title="Editar"
                        className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded hover:bg-white/5"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleToggle(u)}
                        disabled={togglingId === u.id}
                        title={u.activo ? 'Desactivar' : 'Activar'}
                        className={`text-xs px-2 py-1 rounded transition-colors disabled:opacity-50 ${
                          u.activo
                            ? 'text-status-inactive bg-status-inactive/10 hover:bg-status-inactive/20'
                            : 'text-status-active bg-status-active/10 hover:bg-status-active/20'
                        }`}
                      >
                        {togglingId === u.id ? '…' : u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-text-secondary">
          <span>
            Página {page} de {totalPages} · {total} registros
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <UsuarioModal
          usuario={editando}
          roles={roles}
          onClose={() => setModalOpen(false)}
          onSaved={fetchUsuarios}
        />
      )}
    </div>
  )
}

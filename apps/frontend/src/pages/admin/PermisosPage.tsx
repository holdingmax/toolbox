import { useState, useEffect } from 'react'
import {
  getUsuariosSelector,
  getPermisos,
  createPermiso,
  togglePermiso,
  getNiveles,
  type UsuarioSelector,
  type PermisoAdmin,
  type NivelAdmin,
} from '../../api/admin.api'

function getDepth(ruta: string): number {
  return ruta.split('/').filter(Boolean).length - 1
}

export default function PermisosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioSelector[]>([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(true)
  const [selectedUsuario, setSelectedUsuario] = useState<UsuarioSelector | null>(null)

  const [permisos, setPermisos] = useState<PermisoAdmin[]>([])
  const [loadingPermisos, setLoadingPermisos] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const [niveles, setNiveles] = useState<NivelAdmin[]>([])
  const [selectedNivelId, setSelectedNivelId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      getUsuariosSelector(),
      getNiveles(),
    ]).then(([u, n]) => {
      setUsuarios(u)
      setNiveles(n)
    }).finally(() => setLoadingUsuarios(false))
  }, [])

  const loadPermisos = async (usuarioId: string) => {
    setLoadingPermisos(true)
    setAssignError(null)
    setSelectedNivelId('')
    try {
      const data = await getPermisos(usuarioId)
      setPermisos(data)
    } catch {
      setPermisos([])
    } finally {
      setLoadingPermisos(false)
    }
  }

  const handleSelectUsuario = (u: UsuarioSelector) => {
    setSelectedUsuario(u)
    loadPermisos(u.id)
  }

  const handleToggle = async (permiso: PermisoAdmin) => {
    setTogglingId(permiso.id)
    try {
      const updated = await togglePermiso(permiso.id)
      setPermisos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } catch {
      // ignorado
    } finally {
      setTogglingId(null)
    }
  }

  const handleAssign = async () => {
    if (!selectedUsuario || !selectedNivelId) return
    setAssignError(null)
    const existing = permisos.find((p) => p.nivel_id === selectedNivelId)
    setAssigning(true)
    try {
      if (existing) {
        if (!existing.activo) {
          const updated = await togglePermiso(existing.id)
          setPermisos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        } else {
          setAssignError('Ese nivel ya tiene permiso activo para este usuario.')
        }
      } else {
        const nuevo = await createPermiso(selectedUsuario.id, selectedNivelId)
        setPermisos((prev) => [...prev, nuevo])
      }
      setSelectedNivelId('')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Ocurrió un error.'
      setAssignError(Array.isArray(msg) ? msg.join(' · ') : msg)
    } finally {
      setAssigning(false)
    }
  }

  const selectClass =
    'bg-white/5 border border-border-card text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent'

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-text-primary text-2xl font-bold">Permisos por usuario</h1>
        <p className="text-text-secondary text-sm mt-0.5">
          Asignación de niveles visibles por usuario
        </p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Panel izquierdo — lista de usuarios */}
        <div className="w-72 flex-shrink-0 bg-bg-card border border-border-card rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border-card">
            <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">
              Usuarios ({usuarios.length})
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingUsuarios ? (
              <div className="flex items-center justify-center py-10 text-text-secondary text-sm">
                Cargando…
              </div>
            ) : usuarios.length === 0 ? (
              <div className="text-center py-10 text-text-secondary text-sm">
                Sin usuarios
              </div>
            ) : (
              usuarios.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSelectUsuario(u)}
                  className={`w-full text-left px-4 py-3 border-b border-border-card transition-colors ${
                    selectedUsuario?.id === u.id
                      ? 'bg-accent/10 border-l-2 border-l-accent'
                      : 'hover:bg-white/[0.03] border-l-2 border-l-transparent'
                  }`}
                >
                  <p className="text-text-primary text-sm font-medium truncate">{u.nombre}</p>
                  <p className="text-text-secondary text-xs truncate">{u.email}</p>
                  <span className="inline-block mt-1 text-xs bg-white/10 text-text-secondary px-1.5 py-0.5 rounded">
                    {u.rol.nombre}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Panel derecho — permisos */}
        <div className="flex-1 bg-bg-card border border-border-card rounded-xl overflow-hidden flex flex-col">
          {!selectedUsuario ? (
            <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
              <div className="text-center">
                <p className="text-4xl mb-3">🔑</p>
                <p>Seleccioná un usuario para ver sus permisos</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header panel derecho */}
              <div className="px-5 py-3 border-b border-border-card flex-shrink-0">
                <p className="text-text-primary text-sm font-semibold">
                  {selectedUsuario.nombre}
                </p>
                <p className="text-text-secondary text-xs">{selectedUsuario.email}</p>
              </div>

              {/* Lista de permisos */}
              <div className="flex-1 overflow-y-auto">
                {loadingPermisos ? (
                  <div className="flex items-center justify-center py-10 text-text-secondary text-sm">
                    Cargando…
                  </div>
                ) : permisos.length === 0 ? (
                  <div className="text-center py-10 text-text-secondary text-sm">
                    Sin permisos asignados
                  </div>
                ) : (
                  permisos.map((p) => {
                    const depth = getDepth(p.nivel.ruta)
                    return (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 py-3 pr-4 border-b border-border-card hover:bg-white/[0.03] transition-colors"
                        style={{ paddingLeft: depth * 20 + 20 + 'px' }}
                      >
                        {depth > 0 && (
                          <span className="text-white/20 text-xs select-none">└</span>
                        )}
                        <span className="text-base">📁</span>
                        <span className="text-text-primary text-sm font-medium flex-1 min-w-0 truncate">
                          {p.nivel.nombre}
                        </span>
                        <span className="text-xs bg-white/10 text-text-secondary px-2 py-0.5 rounded flex-shrink-0">
                          {p.nivel.tipo}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            p.activo
                              ? 'bg-status-active/20 text-status-active'
                              : 'bg-status-inactive/20 text-status-inactive'
                          }`}
                        >
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        <button
                          onClick={() => handleToggle(p)}
                          disabled={togglingId === p.id}
                          className={`text-xs px-2 py-1 rounded transition-colors disabled:opacity-50 flex-shrink-0 ${
                            p.activo
                              ? 'text-status-inactive bg-status-inactive/10 hover:bg-status-inactive/20'
                              : 'text-status-active bg-status-active/10 hover:bg-status-active/20'
                          }`}
                        >
                          {togglingId === p.id ? '…' : p.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Asignar nuevo permiso */}
              <div className="px-5 py-4 border-t border-border-card flex-shrink-0">
                {assignError && (
                  <p className="text-xs text-status-inactive mb-2">{assignError}</p>
                )}
                <div className="flex gap-2">
                  <select
                    value={selectedNivelId}
                    onChange={(e) => setSelectedNivelId(e.target.value)}
                    className={`flex-1 ${selectClass}`}
                  >
                    <option value="" className="bg-bg-card">
                      Seleccioná un nivel para asignar…
                    </option>
                    {niveles.map((n) => {
                      const depth = getDepth(n.ruta)
                      const indent = '    '.repeat(depth)
                      return (
                        <option key={n.id} value={n.id} className="bg-bg-card">
                          {indent}📁 {n.nombre} ({n.tipo})
                        </option>
                      )
                    })}
                  </select>
                  <button
                    onClick={handleAssign}
                    disabled={!selectedNivelId || assigning}
                    className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {assigning ? '…' : 'Asignar'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

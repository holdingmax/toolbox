import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getNivelDetalle, type NivelDetalle } from '../api/navegacion.api'
import NivelCard from '../components/NivelCard'
import HerramientaCard from '../components/HerramientaCard'

export default function NivelPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [detalle, setDetalle] = useState<NivelDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError('')
    getNivelDetalle(id)
      .then(setDetalle)
      .catch(() => setError('No se pudo cargar este nivel.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-4">
        <div className="h-4 bg-white/10 rounded w-40" />
        <div className="h-8 bg-white/10 rounded w-64" />
        <div className="flex flex-col gap-2 mt-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-bg-card border border-border-card rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !detalle) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-status-inactive text-sm mb-4">{error || 'Nivel no encontrado.'}</p>
        <button onClick={() => navigate(-1)} className="text-accent text-sm hover:underline">
          ← Volver
        </button>
      </div>
    )
  }

  const { nivel, hijos, herramientas, breadcrumb } = detalle

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6 flex-wrap">
        <Link to="/dashboard" className="text-text-secondary hover:text-text-primary transition-colors">
          Inicio
        </Link>
        {breadcrumb.map((crumb) => (
          <span key={crumb.id} className="flex items-center gap-2">
            <span className="text-border-card">/</span>
            {crumb.id === nivel.id ? (
              <span className="text-text-primary font-medium">{crumb.nombre}</span>
            ) : (
              <Link
                to={`/nivel/${crumb.id}`}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                {crumb.nombre}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Título */}
      <div className="flex items-center gap-3 mb-8">
        <span className="text-3xl">
          {nivel.icono_url ? (
            <img src={nivel.icono_url} alt="" className="w-10 h-10 object-contain rounded" />
          ) : (
            '🏢'
          )}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-text-primary">{nivel.nombre}</h1>
            <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent capitalize">
              {nivel.tipo}
            </span>
          </div>
          {nivel.descripcion && (
            <p className="text-text-secondary text-sm mt-0.5">{nivel.descripcion}</p>
          )}
        </div>
      </div>

      {/* Hijos */}
      {hijos.length > 0 && (
        <section className="mb-8">
          <h2 className="text-text-secondary text-sm font-medium uppercase tracking-wider mb-4">
            Áreas
          </h2>
          <div className="flex flex-col gap-2">
            {hijos
              .sort((a, b) => a.orden - b.orden)
              .map((hijo) => (
                <NivelCard key={hijo.id} nivel={hijo} variant="area" />
              ))}
          </div>
        </section>
      )}

      {/* Herramientas */}
      {herramientas.length > 0 && (
        <section>
          <h2 className="text-text-secondary text-sm font-medium uppercase tracking-wider mb-4">
            Herramientas disponibles
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {herramientas
              .sort((a, b) => a.orden - b.orden)
              .map((h) => (
                <HerramientaCard key={h.id} herramienta={h} />
              ))}
          </div>
        </section>
      )}

      {hijos.length === 0 && herramientas.length === 0 && (
        <div className="bg-bg-card border border-border-card rounded-xl p-10 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-text-secondary text-sm">Este nivel no tiene contenido disponible.</p>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { getProyectosAutomatizacionVisibles, type ProyectoAutomatizacion } from '../api/proyectos-automatizacion.api'
import ProyectosAutomatizacionMatriz, { ProyectosAutomatizacionLeyenda } from '../components/ProyectosAutomatizacionMatriz'

function TableroSkeleton() {
  return <div className="bg-bg-card border border-border-card rounded-xl h-64 animate-pulse" />
}

export default function ProyectosAutomatizacionTableroPage() {
  const [proyectos, setProyectos] = useState<ProyectoAutomatizacion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProyectosAutomatizacionVisibles()
      .then(setProyectos)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-text-primary text-2xl font-bold">Proyectos de automatización</h1>
        <p className="text-text-secondary text-sm mt-0.5">
          Seguimiento de las áreas a las que tenés acceso, ordenado por avance
        </p>
      </div>

      <ProyectosAutomatizacionLeyenda />

      {loading ? (
        <TableroSkeleton />
      ) : proyectos.length === 0 ? (
        <div className="bg-bg-card border border-border-card rounded-xl p-10 text-center">
          <p className="text-4xl mb-3">🤖</p>
          <p className="text-text-secondary text-sm">No hay proyectos de automatización en seguimiento para tus áreas.</p>
        </div>
      ) : (
        <ProyectosAutomatizacionMatriz proyectos={proyectos} />
      )}
    </div>
  )
}

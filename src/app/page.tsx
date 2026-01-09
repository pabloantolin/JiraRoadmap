import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Jira Roadmap Visualization</h1>
        <p className="text-gray-600 mb-8">Visualizaciones de epics de Jira</p>
        
        <div className="space-y-4">
          <Link href="/home" className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ver todas las visualizaciones</h2>
            <p className="text-gray-600 text-sm">Accede al índice de visualizaciones disponibles</p>
          </Link>
          
          <Link href="/roadmap" className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Global Roadmap Timeline</h2>
            <p className="text-gray-600 text-sm">Timeline visual de epics con filtros y calendario interactivo</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

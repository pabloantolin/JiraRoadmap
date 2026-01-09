"use client";

import Link from "next/link";

export default function Home() {
  const visualizations = [
    {
      title: "Global Roadmap Timeline",
      description: "Timeline visual de epics con filtros y calendario interactivo",
      href: "/roadmap",
      status: "Disponible"
    },
    {
      title: "Visual Roadmap Swimlane",
      description: "Visualización por carriles (swimlanes) de epics",
      href: "/swimlane",
      status: "En construcción"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Visualizaciones Jira</h1>
        <p className="text-gray-600 mb-8">Selecciona una visualización para explorar los epics de Jira</p>
        
        <div className="grid gap-6 md:grid-cols-2">
          {visualizations.map((viz) => (
            <Link
              key={viz.href}
              href={viz.href}
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{viz.title}</h2>
              <p className="text-gray-600 text-sm mb-3">{viz.description}</p>
              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                viz.status === "Disponible" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {viz.status}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

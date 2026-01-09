'use client';
import React, { useEffect, useState } from 'react';

interface Epic {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: { name: string };
    startDate?: string;
    dueDate?: string;
    fixVersions?: { name: string }[];
    customfield_29704?: string; // Representative Image
    customfield_21800?: string; // Start Date
    customfield_21801?: string; // End Date
    customfield_29701?: string; // Feature Type
  };
}

export default function Roadmap() {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fixVersion, setFixVersion] = useState<string>('');
  const [fixVersionOptions, setFixVersionOptions] = useState<{id: string, name: string}[]>([]);
  const [featureType, setFeatureType] = useState<string>('');
  const [featureTypeOptions, setFeatureTypeOptions] = useState<string[]>([]);
  const [timelineStart, setTimelineStart] = useState<string>('');
  const [timelineEnd, setTimelineEnd] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/jira/epics${fixVersion ? `?fixVersion=${encodeURIComponent(fixVersion)}` : ''}`)
      .then(res => res.json())
      .then(data => {
        setEpics(data.epics || []);
        // Usar todas las versiones del backend para el selector
        const uniqueVersions = new Map<string, {id: string, name: string}>();
        (data.fixVersionsAll || []).forEach((v: any) => {
          if (v && typeof v.name === 'string' && v.name.trim() !== '' && !uniqueVersions.has(v.name)) {
            uniqueVersions.set(v.name, { id: String(v.id), name: v.name });
          }
        });
        const fixVersionArr = Array.from(uniqueVersions.values());
        console.log('fixVersionOptions:', fixVersionArr);
        setFixVersionOptions(fixVersionArr);
        // Extraer Feature Types únicos
        const ftSet = new Set<string>();
        (data.epics || []).forEach((epic: Epic) => {
          if (epic.fields.customfield_29701) ftSet.add(String(epic.fields.customfield_29701));
        });
        const ftArr = Array.from(ftSet).filter(v => typeof v === 'string' && v.trim() !== '');
        console.log('featureTypeOptions:', ftArr);
        setFeatureTypeOptions(ftArr);

        // Calcular rango por defecto: épica más temprana y más tardía
        const allStartDates = (data.epics || [])
          .map((e: any) => e.fields.customfield_21800)
          .filter(Boolean)
          .map((d: string) => new Date(d).getTime());
        const allEndDates = (data.epics || [])
          .map((e: any) => e.fields.customfield_21801)
          .filter(Boolean)
          .map((d: string) => new Date(d).getTime());
        if (allStartDates.length && allEndDates.length) {
          const min = new Date(Math.min(...allStartDates));
          const max = new Date(Math.max(...allEndDates));
          setTimelineStart(min.toISOString().split('T')[0]);
          setTimelineEnd(max.toISOString().split('T')[0]);
        }

        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [fixVersion]);

  if (loading) return <div className="p-8">Loading epics...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  // Calcular fechas mínimas y máximas para el timeline
  const allDates = epics.flatMap(e => [e.fields.customfield_21800, e.fields.customfield_21801].filter(Boolean));
  const minDate = allDates.length ? new Date(Math.min(...allDates.map(d => new Date(d!).getTime()))) : null;
  const maxDate = allDates.length ? new Date(Math.max(...allDates.map(d => new Date(d!).getTime()))) : null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Jira Epics Roadmap</h1>
      <div className="mb-4 flex gap-8 items-end">
        <div>
          <label className="mr-2 font-medium">Filtrar por fixVersion:</label>
          <select
            className="border rounded px-2 py-1"
            value={fixVersion}
            onChange={e => setFixVersion(e.target.value)}
          >
            <option value="">-- Todas --</option>
            {fixVersionOptions.map(v => (
              <option key={v.id} value={v.name ?? ''}>{v.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mr-2 font-medium">Filtrar por Feature Type:</label>
          <select
            className="border rounded px-2 py-1"
            value={featureType}
            onChange={e => setFeatureType(e.target.value)}
          >
            <option value="">-- Todos --</option>
            {featureTypeOptions.map(v => (
              <option key={String(v)} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Timeline interactivo con calendarios */}
      <div className="mb-6 border border-gray-300 rounded p-4 bg-gray-50">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Inicio</label>
            <input
              type="date"
              value={timelineStart}
              onChange={e => setTimelineStart(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Fin</label>
            <input
              type="date"
              value={timelineEnd}
              onChange={e => setTimelineEnd(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
        {/* Meses/quarters dinámicos según el rango */}
        <div className="flex items-center mt-3 text-xs font-semibold text-gray-700 border-t pt-2">
          <div className="w-48" />
          <div className="flex-1 flex justify-between">
            {timelineStart && timelineEnd && (() => {
              const start = new Date(timelineStart);
              const end = new Date(timelineEnd);
              const months = [];
              for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
                months.push(d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }));
              }
              return months.map(m => <span key={m}>{m}</span>);
            })()}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="flex flex-col gap-3 min-w-[700px]">
          {epics
          .filter(epic => !featureType || epic.fields.customfield_29701 === featureType)
          .filter(epic => {
            // Filtrar por rango del timeline si ambas fechas están definidas
            if (!timelineStart || !timelineEnd) return true;
            const epicStart = epic.fields.customfield_21800 ? new Date(epic.fields.customfield_21800).getTime() : null;
            const epicEnd = epic.fields.customfield_21801 ? new Date(epic.fields.customfield_21801).getTime() : null;
            if (!epicStart || !epicEnd) return true;
            const rangeStart = new Date(timelineStart).getTime();
            const rangeEnd = new Date(timelineEnd).getTime();
            return epicEnd >= rangeStart && epicStart <= rangeEnd;
          })
          .map(epic => {
            const { summary, customfield_29704, customfield_21800, customfield_21801 } = epic.fields;
            let barContent = null;
            if (customfield_21800 && customfield_21801) {
              const start = new Date(customfield_21800).getTime();
              const end = new Date(customfield_21801).getTime();
              // Usar el rango del timeline para posicionar
              const rangeStart = timelineStart ? new Date(timelineStart).getTime() : start;
              const rangeEnd = timelineEnd ? new Date(timelineEnd).getTime() : end;
              const total = rangeEnd - rangeStart;
              const left = ((start - rangeStart) / total) * 100;
              const width = ((end - start) / total) * 100;
              barContent = (
                <div className="relative h-3">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-2 bg-blue-500 rounded-full"
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                </div>
              );
            } else {
              barContent = (
                <div className="flex items-center h-3 relative">
                  <span className="block w-3 h-3 bg-blue-500 rounded-full m-auto" title="Sin fechas" />
                </div>
              );
            }
            return (
              <div key={epic.id} className="relative min-h-[38px]">
                {/* Timeline de la épica */}
                <div className="flex items-center gap-2 h-3">
                  <div className="w-48 text-right pr-3" />
                  <div className="flex-1 relative h-3">
                    {barContent}
                  </div>
                </div>
                {/* Nombre flotante encima del timeline, alineado al inicio */}
                <div className="absolute top-0 left-0 right-0 flex items-center gap-2 pointer-events-none">
                  <div className="w-48 pr-3" />
                  <div className="flex-1 relative">
                    {customfield_21800 && customfield_21801 && (
                      <span
                        className="absolute text-xs font-semibold text-gray-800 bg-white px-1 rounded shadow-sm"
                        style={{
                          left: `${((new Date(customfield_21800).getTime() - (timelineStart ? new Date(timelineStart).getTime() : new Date(customfield_21800).getTime())) / ((timelineEnd ? new Date(timelineEnd).getTime() : new Date(customfield_21801).getTime()) - (timelineStart ? new Date(timelineStart).getTime() : new Date(customfield_21800).getTime()))) * 100}%`,
                          transform: 'translateX(-50%)',
                          top: '-20px'
                        }}
                      >
                        {summary}
                      </span>
                    )}
                    {(!customfield_21800 || !customfield_21801) && (
                      <span className="absolute left-0 text-xs font-semibold text-gray-800 bg-white px-1 rounded shadow-sm" style={{ top: '-20px' }}>
                        {summary}
                      </span>
                    )}
                  </div>
                  {customfield_29704 && (
                    <img src={`/api/jira/image-proxy?url=${encodeURIComponent(customfield_29704)}`} alt="Imagen" className="max-h-8 max-w-8 object-contain ml-2 border rounded shadow pointer-events-auto" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

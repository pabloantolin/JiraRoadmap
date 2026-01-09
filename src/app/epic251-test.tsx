'use client';
import React, { useEffect, useState } from 'react';

export default function Epic251Test() {
  const [epic, setEpic] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/jira/epic251')
      .then(res => res.json())
      .then(data => setEpic(data))
      .catch(e => setError(e.message));
  }, []);

  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!epic) return <div className="p-8">Cargando épica JEFE-251...</div>;
  if (epic.error) return <div className="p-8 text-red-500">Error: {epic.error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{epic.key}: {epic.summary}</h1>
      <div className="prose max-w-xl mb-4">
        {typeof epic.description === 'string' ? (
          <div dangerouslySetInnerHTML={{ __html: epic.description }} />
        ) : (
          <pre>{JSON.stringify(epic.description, null, 2)}</pre>
        )}
      </div>
      {epic.representativeImage && (
        <img src={`/api/jira/image-proxy?url=${encodeURIComponent(epic.representativeImage)}`} alt="Representative" className="max-w-xs border rounded shadow" />
      )}
      {!epic.representativeImage && <div>No Representative Image</div>}
    </div>
  );
}

"use client";

interface FilterConfig {
  id: string;
  title: string;
  enabled: boolean;
}

interface FilterManagerProps {
  availableFilters: FilterConfig[];
  enabledFilters: FilterConfig[];
  onToggleFilter: (filterId: string) => void;
  onClose: () => void;
}

export default function FilterManager({ 
  availableFilters, 
  enabledFilters, 
  onToggleFilter, 
  onClose 
}: FilterManagerProps) {
  console.log('FilterManager: rendering with enabledFilters', enabledFilters);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Configure Filters</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lista de filtros */}
        <div className="space-y-1">
          {availableFilters.map((filter) => {
            const isEnabled = enabledFilters.some(f => filter.id === f.id && f.enabled === true);
            
            return (
              <label
                key={filter.id}
                className="flex items-center p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => {
                    onToggleFilter(filter.id);
                  }}
                  className="mr-2 h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-900">{filter.title}</div>
                </div>
              </label>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

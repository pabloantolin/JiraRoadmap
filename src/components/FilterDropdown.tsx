"use client";

import { useState, useEffect, useRef, useMemo } from "react";

interface FilterOption {
  id: string;
  key?: string;
  value: string;
  summary?: string;
}

interface FilterDropdownProps {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  onRemove?: () => void; // Nueva prop para eliminar el filtro
}

export default function FilterDropdown({ 
  title, 
  options, 
  selectedValues, 
  onChange,
  placeholder = "Any",
  onRemove 
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar opciones basadas en búsqueda
  const filteredOptions = useMemo(() => {
    const specialOptions: FilterOption[] = [
      { id: 'empty', value: '(Empty)' },
      { id: 'not_empty', value: '(Not empty)' }
    ];

    const regularOptions = options.filter(option =>
      option.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.value.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return [...specialOptions, ...regularOptions];
  }, [options, searchTerm]);

  // Manejar cambio en checkbox
  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    let newSelectedValues: string[];
    
    if (optionValue === '(Empty)') {
      // Lógica especial para Empty
      if (checked) {
        newSelectedValues = ['(Empty)', ...selectedValues.filter(v => v !== '(Not empty)')];
      } else {
        newSelectedValues = selectedValues.filter(v => v !== '(Empty)');
      }
    } else if (optionValue === '(Not empty)') {
      // Lógica especial para Not empty
      if (checked) {
        newSelectedValues = ['(Not empty)', ...selectedValues.filter(v => v !== '(Empty)')];
      } else {
        newSelectedValues = selectedValues.filter(v => v !== '(Not empty)');
      }
    } else {
      // Lógica normal para opciones regulares
      if (checked) {
        newSelectedValues = [...selectedValues.filter(v => v !== '(Empty)' && v !== '(Not empty)'), optionValue];
      } else {
        newSelectedValues = selectedValues.filter(v => v !== optionValue);
      }
    }
    
    onChange(newSelectedValues);
  };

  // Obtener texto a mostrar
  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      // Buscar el nombre correspondiente al valor seleccionado
      const selectedOption = options.find(opt => opt.value === selectedValues[0]);
      return selectedOption?.summary || selectedValues[0];
    }
    return `${selectedValues.length} selected`;
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Botón principal con X para eliminar */}
      <div className="flex items-center gap-2">
        {/* Botón X para eliminar filtro */}
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors"
            title="Remove filter"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 p-1 border border-gray-300 rounded-md bg-white text-left flex justify-between items-center hover:bg-gray-50 transition-colors min-w-0 whitespace-nowrap"
        >
          <span className="text-xs font-medium text-gray-900 truncate">
            {title}: {getDisplayText()}
          </span>
          <svg 
            className={`w-3 h-3 text-gray-600 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 min-w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-hidden">
          {/* Buscador */}
          <div className="p-2 border-b border-gray-200 bg-gray-50">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-1 border border-gray-300 rounded text-xs bg-white text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Lista de opciones */}
          <div className="max-h-48 overflow-y-auto p-1 bg-white">
            {filteredOptions.map((option: FilterOption) => (
              <label
                key={option.id}
                className="flex items-center p-1 hover:bg-blue-50 rounded cursor-pointer text-xs text-gray-900"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
                  className="mr-2 text-blue-600 focus:ring-blue-500 focus:ring-1 border-gray-300 rounded bg-white w-3 h-3"
                />
                <span className="flex-1 truncate">
                  {option.summary || option.value}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from "react";
import FilterDropdown from "@/components/FilterDropdown";
import FilterManager from "@/components/FilterManager";
import { toSvg, toPng } from "dom-to-image";

interface Epic {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: { name: string };
    assignee?: {
      displayName: string;
      emailAddress?: string;
      name?: string;
      key?: string;
    };
    fixVersions: { id: string; name: string }[];
    labels?: string[];
    customfield_29701?: any;
    customfield_29702?: string;
    customfield_29704?: string;
    customfield_29713?: any;
    customfield_29712?: any;
    customfield_29800?: any;
    customfield_21800?: any;
    customfield_21801?: any[];
    customfield_10011?: any;
  };
}

interface EpicBlock {
  id: string;
  epic: Epic;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Función para obtener el logo del producto del OB Reach
const getObReachLogo = (obReach: string) => {
  const logoMap: Record<string, string> = {
    'SPAIN': '/images/ob-reach/spain-logo.svg',
    'BRAZIL': '/images/ob-reach/brazil-logo.svg', 
    'HISPAM': '/images/ob-reach/hispam-logo.svg',
    'GERMANY': '/images/ob-reach/germany-logo.svg'
  };
  
  return logoMap[obReach] || '';
};

const getObReachDisplay = (obReaches: any[]) => {
  if (!obReaches || obReaches.length === 0) return null;
  
  // Solo mostrar si hay exactamente un OB Reach
  if (obReaches.length === 1) {
    const reach = typeof obReaches[0] === 'object' ? obReaches[0].value : obReaches[0];
    const logo = getObReachLogo(reach);
    
    return (
      <div className="flex items-start">
        {logo && (
          <img 
            src={logo} 
            alt={`${reach} logo`}
            className="w-6 h-6 object-contain"
          />
        )}
      </div>
    );
  }
  
  return null;
};

export default function Swimlane() {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fixVersion, setFixVersion] = useState<string>('');
  const [fixVersionOptions, setFixVersionOptions] = useState<{id: string, name: string}[]>([]);
  const [selectedFixVersions, setSelectedFixVersions] = useState<string[]>([]);
  const [initiatives, setInitiatives] = useState<{id: string, key: string, summary: string}[]>([]);
  const [selectedInitiatives, setSelectedInitiatives] = useState<string[]>([]);
  const [themes, setThemes] = useState<{id: string, key: string, summary: string}[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [devices, setDevices] = useState<{id: string, value: string, name: string}[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [showFilterManager, setShowFilterManager] = useState(false);
  const [showCustomizeCard, setShowCustomizeCard] = useState(false);
  
  // Configuración de campos visibles en las cards
  const [cardFields, setCardFields] = useState({
    title: true,
    shortDescription: false,
    image: false,
    labels: false,
    obReach: false
  });
  
  // Orden de los campos en el card
  const [fieldOrder, setFieldOrder] = useState(['title']);
  
  // Posición horizontal de los campos (left, center, right)
  const [fieldPositions, setFieldPositions] = useState({
    title: 'left',
    shortDescription: 'left',
    image: 'center',
    labels: 'left',
    obReach: 'right'
  });
  
  // Estados para drag & drop
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [dragOverField, setDragOverField] = useState<string | null>(null);
  const [cardPreviewHeight, setCardPreviewHeight] = useState(60);
  
  // Actualizar altura del preview cuando cambian los campos
  useEffect(() => {
    const timer = setTimeout(() => {
      setCardPreviewHeight(calculateCardHeight());
    }, 100);
    return () => clearTimeout(timer);
  }, [cardFields]);
  
  // Funciones para drag & drop
  const handleDragStart = (field: string) => {
    setDraggedField(field);
  };
  
  const handleDragOver = (e: React.DragEvent, field: string) => {
    e.preventDefault();
    setDragOverField(field);
  };
  
  const handleDragLeave = () => {
    setDragOverField(null);
  };
  
  const handleDrop = (e: React.DragEvent, field: string) => {
    e.preventDefault();
    if (draggedField && draggedField !== field) {
      const newOrder = [...fieldOrder];
      const draggedIndex = newOrder.indexOf(draggedField);
      const targetIndex = newOrder.indexOf(field);
      
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedField);
      
      setFieldOrder(newOrder);
    }
    
    setDraggedField(null);
    setDragOverField(null);
  };
  
  // Función para cambiar la posición horizontal de un campo
  const updateFieldPosition = (field: string, position: 'left' | 'center' | 'right') => {
    setFieldPositions(prev => ({
      ...prev,
      [field]: position
    }));
  };
  
  // Función para activar un campo (agregar al final del orden)
  const activateField = (field: string) => {
    setCardFields(prev => ({
      ...prev,
      [field]: true
    }));
    
    // Agregar al final del orden si no está ya
    setFieldOrder(prev => {
      if (!prev.includes(field)) {
        return [...prev, field];
      }
      return prev;
    });
  };
  
  // Función para desactivar un campo (eliminar del orden)
  const deactivateField = (field: string) => {
    setCardFields(prev => ({
      ...prev,
      [field]: false
    }));
    
    // Eliminar del orden
    setFieldOrder(prev => prev.filter(f => f !== field));
  };
  
  const [featureTypes, setFeatureTypes] = useState<{id: string, value: string, name: string}[]>([]);
  const [selectedFeatureTypes, setSelectedFeatureTypes] = useState<string[]>([]);
  const [obReaches, setObReaches] = useState<{id: string, value: string, name: string}[]>([]);
  const [selectedObReaches, setSelectedObReaches] = useState<string[]>([]);
  const [sponsors, setSponsors] = useState<{id: string, value: string, name: string}[]>([]);
  const [selectedSponsors, setSelectedSponsors] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<{id: string, value: string, name: string}[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [assignees, setAssignees] = useState<{id: string, value: string, name: string}[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [labels, setLabels] = useState<{id: string, value: string, name: string}[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  // Definición de filtros disponibles
  const availableFilters = [
    { id: 'releases', title: 'Releases', enabled: true },
    { id: 'initiatives', title: 'Initiatives', enabled: true },
    { id: 'themes', title: 'Themes', enabled: true },
    { id: 'devices', title: 'Devices & Platform', enabled: true },
    { id: 'featureTypes', title: 'Feature Type', enabled: true },
    { id: 'obReaches', title: 'OB Reach', enabled: true },
    { id: 'sponsors', title: 'Sponsor', enabled: true },
    { id: 'statuses', title: 'Status', enabled: true },
    { id: 'assignees', title: 'Assignee', enabled: true },
    { id: 'labels', title: 'Labels', enabled: true },
  ];

  const [enabledFilters, setEnabledFilters] = useState([
    { id: 'releases', title: 'Releases', enabled: true },
    { id: 'initiatives', title: 'Initiatives', enabled: true },
    { id: 'themes', title: 'Themes', enabled: true },
    { id: 'devices', title: 'Devices & Platform', enabled: true },
    { id: 'featureTypes', title: 'Feature Type', enabled: true },
    { id: 'obReaches', title: 'OB Reach', enabled: true },
    { id: 'sponsors', title: 'Sponsor', enabled: true },
    { id: 'statuses', title: 'Status', enabled: true },
    { id: 'assignees', title: 'Assignee', enabled: true },
    { id: 'labels', title: 'Labels', enabled: true },
  ]);
  const [enabledFiltersString, setEnabledFiltersString] = useState(JSON.stringify([
    { id: 'releases', title: 'Releases', enabled: true },
    { id: 'initiatives', title: 'Initiatives', enabled: true },
    { id: 'themes', title: 'Themes', enabled: true },
    { id: 'devices', title: 'Devices & Platform', enabled: true },
    { id: 'featureTypes', title: 'Feature Type', enabled: true },
    { id: 'obReaches', title: 'OB Reach', enabled: true },
    { id: 'sponsors', title: 'Sponsor', enabled: true },
    { id: 'statuses', title: 'Status', enabled: true },
    { id: 'assignees', title: 'Assignee', enabled: true },
    { id: 'labels', title: 'Labels', enabled: true },
  ]));

  // Funciones para gestionar filtros configurables
  const toggleFilter = (filterId: string) => {
    setEnabledFilters(prev => {
      const newFilters = prev.map(filter => 
        filter.id === filterId 
          ? { ...filter, enabled: !filter.enabled }
          : filter
      );
      
      // Forzar actualización del string
      setEnabledFiltersString(JSON.stringify(newFilters));
      
      return newFilters;
    });
  };

  const removeFilter = (filterId: string) => {
    setEnabledFilters(prev => 
      prev.map(filter => 
        filter.id === filterId 
          ? { ...filter, enabled: false }
          : filter
      )
    );
    
    // Limpiar valores del filtro eliminado
    switch (filterId) {
      case 'releases':
        setSelectedFixVersions([]);
        break;
      case 'initiatives':
        setSelectedInitiatives([]);
        break;
      case 'themes':
        setSelectedThemes([]);
        break;
      case 'devices':
        setSelectedDevices([]);
        break;
    }
  };

  const isFilterEnabled = (filterId: string) => {
    return enabledFilters.some(filter => filter.id === filterId && filter.enabled);
  };

  // Función para generar la leyenda de colores
  const getColorLegend = () => {
    if (colorBy === 'default') return null;
    
    const uniqueValues = new Set<string>();
    epics.forEach(epic => {
      let value = '';
      switch (colorBy) {
        case 'status':
          value = epic.fields.status?.name || '';
          break;
        case 'assignee':
          value = epic.fields.assignee?.displayName || 'Unassigned';
          break;
        case 'featureType':
          const featureType = epic.fields.customfield_29701;
          value = featureType ? (typeof featureType === 'object' ? featureType.value : featureType) : '';
          break;
        case 'device':
          const device = epic.fields.customfield_29713;
          if (Array.isArray(device)) {
            device.forEach((deviceOption: any) => {
              const deviceValue = deviceOption.value;
              if (deviceValue) uniqueValues.add(deviceValue);
            });
          } else if (device && typeof device === 'object') {
            const deviceValue = device.value?.value;
            if (deviceValue) uniqueValues.add(deviceValue);
          }
          return null; // Skip individual processing for arrays
        default:
          return null;
      }
      
      if (value) uniqueValues.add(value);
    });
    
    return Array.from(uniqueValues).sort().map(value => {
      // Crear un epic mock para obtener el color
      const mockEpic: Epic = {
        id: '',
        key: '',
        fields: {
          summary: '',
          status: colorBy === 'status' ? { name: value } : { name: '' },
          fixVersions: [],
          customfield_29701: colorBy === 'featureType' ? { value } : undefined,
          customfield_29702: '',
          customfield_29704: '',
          customfield_29713: colorBy === 'device' ? { value: { value } } : undefined,
          customfield_29712: undefined,
          customfield_29800: undefined,
          customfield_21800: undefined,
          customfield_21801: [],
          customfield_10011: undefined,
          assignee: colorBy === 'assignee' ? { displayName: value } : undefined
        }
      };
      
      return {
        value,
        color: getEpicColor(mockEpic)
      };
    });
  };

  // Función para obtener el color según la opción seleccionada
  const getEpicColor = (epic: Epic) => {
    switch (colorBy) {
      case 'default':
        return defaultEpicColor;
      case 'status':
        return getStatusColor(epic.fields.status?.name);
      case 'assignee':
        return getAssigneeColor(epic.fields.assignee?.displayName);
      case 'initiative':
        return getInitiativeColor(epic.fields.customfield_10011 || epic.fields.customfield_21801?.[0] || epic.fields.customfield_21800);
      case 'featureType':
        return getFeatureTypeColor(epic.fields.customfield_29701); // Confirmado desde API
      case 'device':
        return getDeviceColor(epic.fields.customfield_29713); // Confirmado desde API
      default:
        return 'bg-white';
    }
  };

  // Función para obtener valores únicos para una opción
  const getUniqueValues = (option: string): string[] => {
    // Para "default", no buscar valores
    if (option === 'default') return [];
    
    const values = new Set<string>();
    epics.forEach(epic => {
      let value: string | undefined;
      
      // Debug: mostrar primeros valores para entender los campos
      if (epics.indexOf(epic) === 0) {
        console.log('Debug - Epic fields COMPLETOS:', {
          key: epic.key,
          summary: epic.fields.summary,
          status: epic.fields.status?.name,
          assignee: epic.fields.assignee?.displayName,
          // Mostrar TODOS los customfields disponibles
          customfield_29701: {
            value: epic.fields.customfield_29701,
            type: typeof epic.fields.customfield_29701,
            isArray: Array.isArray(epic.fields.customfield_29701),
            keys: epic.fields.customfield_29701 ? Object.keys(epic.fields.customfield_29701) : null
          },
          customfield_29713: {
            value: epic.fields.customfield_29713,
            type: typeof epic.fields.customfield_29713,
            isArray: Array.isArray(epic.fields.customfield_29713),
            keys: epic.fields.customfield_29713 ? Object.keys(epic.fields.customfield_29713) : null
          },
          customfield_21800: {
            value: epic.fields.customfield_21800,
            type: typeof epic.fields.customfield_21800,
            isArray: Array.isArray(epic.fields.customfield_21800),
            keys: epic.fields.customfield_21800 ? Object.keys(epic.fields.customfield_21800) : null
          },
          customfield_21801: {
            value: epic.fields.customfield_21801,
            type: typeof epic.fields.customfield_21801,
            isArray: Array.isArray(epic.fields.customfield_21801),
            length: epic.fields.customfield_21801?.length,
            firstItem: epic.fields.customfield_21801?.[0]
          },
          customfield_10011: {
            value: epic.fields.customfield_10011,
            type: typeof epic.fields.customfield_10011,
            isArray: Array.isArray(epic.fields.customfield_10011),
            keys: epic.fields.customfield_10011 ? Object.keys(epic.fields.customfield_10011) : null
          },
          // Mostrar otros campos que podrían contener los datos
          customfield_29702: {
            value: epic.fields.customfield_29702,
            type: typeof epic.fields.customfield_29702
          },
          customfield_29704: {
            value: epic.fields.customfield_29704,
            type: typeof epic.fields.customfield_29704
          },
          customfield_29712: {
            value: epic.fields.customfield_29712,
            type: typeof epic.fields.customfield_29712
          },
          customfield_29800: {
            value: epic.fields.customfield_29800,
            type: typeof epic.fields.customfield_29800
          }
        });
        
        // Debug adicional: mostrar todos los campos del epic
        console.log('Debug - TODOS los campos del epic:', Object.keys(epic.fields));
      }
      
      // Debug específico para valores únicos
      if (epics.indexOf(epic) === 0) {
        console.log('Debug - Extrayendo valores para opción:', option);
        
        // Debug para Feature Type
        if (option === 'featureType') {
          const featureType = epic.fields.customfield_29701;
          const extractedValue = featureType ? (typeof featureType === 'object' ? featureType.value : featureType) : undefined;
          console.log('Debug - Feature Type extraction:', {
            rawField: featureType,
            extractedValue: extractedValue,
            fieldType: typeof featureType
          });
        }
        
        // Debug para Devices
        if (option === 'device') {
          const device = epic.fields.customfield_29713;
          console.log('Debug - Device extraction:', {
            rawField: device,
            isArray: Array.isArray(device),
            arrayLength: device?.length,
            firstItem: device?.[0]
          });
        }
        
        // Debug para Initiative - mostrar todos los campos posibles
        if (option === 'initiative') {
          console.log('Debug - Initiative fields exploration:', {
            customfield_10011: {
              value: epic.fields.customfield_10011,
              type: typeof epic.fields.customfield_10011,
              isArray: Array.isArray(epic.fields.customfield_10011),
              keys: epic.fields.customfield_10011 ? Object.keys(epic.fields.customfield_10011) : null
            },
            customfield_21801: {
              value: epic.fields.customfield_21801,
              type: typeof epic.fields.customfield_21801,
              isArray: Array.isArray(epic.fields.customfield_21801),
              length: epic.fields.customfield_21801?.length,
              firstItem: epic.fields.customfield_21801?.[0]
            },
            customfield_21800: {
              value: epic.fields.customfield_21800,
              type: typeof epic.fields.customfield_21800,
              isArray: Array.isArray(epic.fields.customfield_21800),
              keys: epic.fields.customfield_21800 ? Object.keys(epic.fields.customfield_21800) : null
            },
            customfield_29704: {
              value: epic.fields.customfield_29704,
              type: typeof epic.fields.customfield_29704,
              isArray: Array.isArray(epic.fields.customfield_29704),
              keys: epic.fields.customfield_29704 ? Object.keys(epic.fields.customfield_29704) : null
            },
            customfield_29702: {
              value: epic.fields.customfield_29702,
              type: typeof epic.fields.customfield_29702,
              isArray: Array.isArray(epic.fields.customfield_29702),
              keys: epic.fields.customfield_29702 ? Object.keys(epic.fields.customfield_29702) : null
            },
            epicSummary: epic.fields.summary,
            epicKey: epic.key
          });
        }
      }
      
      // Debug final: mostrar valores acumulados
      if (epics.indexOf(epic) === epics.length - 1) {
        console.log('Debug - Valores finales para', option, ':', Array.from(values));
      }
      
      switch (option) {
        case 'status':
          value = epic.fields.status?.name;
          break;
        case 'assignee':
          value = epic.fields.assignee?.displayName;
          break;
        case 'initiative':
          // Initiative necesita otro campo, probar diferentes opciones
          // Intentar diferentes campos que podrían contener iniciativas
          const initiative = epic.fields.customfield_10011 || 
                            epic.fields.customfield_21801?.[0] || 
                            epic.fields.customfield_21800 ||
                            epic.fields.customfield_29704 ||  // Probar este campo
                            epic.fields.customfield_29702;  // Probar este campo
          
          let initiativeValue: string | undefined;
          
          if (initiative) {
            if (Array.isArray(initiative)) {
              const initiativeItem = initiative[0];
              initiativeValue = initiativeItem ? (typeof initiativeItem === 'object' ? initiativeItem.value?.value || initiativeItem.value : initiativeItem) : undefined;
            } else {
              initiativeValue = typeof initiative === 'object' ? initiative.value?.value || initiative.value : initiative;
            }
            
            // Filtrar valores que parecen fechas (formato YYYY-MM-DD o YYYY-DD-MM)
            if (initiativeValue && /^\d{4}-\d{2}-\d{2}$/.test(initiativeValue)) {
              initiativeValue = undefined; // Ignorar fechas
            }
            
            // Filtrar valores que son solo números
            if (initiativeValue && /^\d+$/.test(initiativeValue)) {
              initiativeValue = undefined; // Ignorar números solos
            }
          }
          
          value = initiativeValue;
          break;
        case 'featureType':
          // Feature Type está en customfield_29701 (objeto con .value directo)
          const featureType = epic.fields.customfield_29701;
          value = featureType ? (typeof featureType === 'object' ? featureType.value : featureType) : undefined;
          break;
        case 'device':
          // Devices & Platform está en customfield_29713 (ARRAY de objetos)
          const device = epic.fields.customfield_29713;
          if (Array.isArray(device)) {
            // Extraer todos los valores del array
            device.forEach((deviceOption: any) => {
              const deviceValue = deviceOption.value;
              if (deviceValue) values.add(deviceValue);
            });
          } else if (device && typeof device === 'object') {
            const deviceValue = device.value?.value;
            if (deviceValue) values.add(deviceValue);
          }
          // No necesitamos continuar con el switch para device
          break;
        default:
          break;
      }
      
      // Solo agregar valor si no es 'device' (ya se procesó arriba)
      if (option !== 'device' && value) values.add(value);
    });
    return Array.from(values).sort();
  };

  // Funciones de color actualizadas para usar mappings personalizados
  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-white border-gray-300';
    if (colorMappings.status && colorMappings.status[status]) {
      return colorMappings.status[status];
    }
    const colors: Record<string, string> = {
      'Done': 'bg-green-100 border-green-300',
      'In Progress': 'bg-blue-100 border-blue-300',
      'To Do': 'bg-gray-100 border-gray-300',
      'Blocked': 'bg-red-100 border-red-300',
    };
    return colors[status] || 'bg-white border-gray-300';
  };

  const getAssigneeColor = (assignee?: string) => {
    if (!assignee) return 'bg-gray-50 border-gray-300';
    if (colorMappings.assignee && colorMappings.assignee[assignee]) {
      return colorMappings.assignee[assignee];
    }
    // Colores basados en hash del nombre para consistencia
    const colors = ['bg-purple-100 border-purple-300', 'bg-yellow-100 border-yellow-300', 'bg-pink-100 border-pink-300', 'bg-indigo-100 border-indigo-300'];
    const hash = assignee.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getInitiativeColor = (initiative?: any) => {
    if (!initiative) return 'bg-white border-gray-300';
    
    // Intentar obtener el valor del initiative con estructura anidada
    let initiativeValue: string | undefined;
    if (Array.isArray(initiative)) {
      const initiativeItem = initiative[0];
      initiativeValue = initiativeItem ? (typeof initiativeItem === 'object' ? initiativeItem.value?.value || initiativeItem.value : initiativeItem) : undefined;
    } else {
      initiativeValue = typeof initiative === 'object' ? initiative.value?.value || initiative.value : initiative;
    }
    
    if (!initiativeValue) return 'bg-white border-gray-300';
    
    if (colorMappings.initiative && colorMappings.initiative[initiativeValue]) {
      return colorMappings.initiative[initiativeValue];
    }
    
    const colors = ['bg-orange-200 border-orange-300', 'bg-teal-200 border-teal-300', 'bg-cyan-200 border-cyan-300'];
    const hash = String(initiativeValue).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getFeatureTypeColor = (featureType?: any) => {
    if (!featureType) return 'bg-white border-gray-300';
    
    // Feature Type tiene .value directo (no .value.value)
    const featureTypeValue = typeof featureType === 'object' ? featureType.value : featureType;
    if (!featureTypeValue) return 'bg-white border-gray-300';
    
    if (colorMappings.featureType && colorMappings.featureType[featureTypeValue]) {
      return colorMappings.featureType[featureTypeValue];
    }
    
    const colors: Record<string, string> = {
      'New Feature': 'bg-emerald-200 border-emerald-300',
      'Improvement': 'bg-amber-200 border-amber-300',
      'Bug': 'bg-rose-200 border-rose-300',
      'BBoB Feature': 'bg-purple-200 border-purple-300',
    };
    return colors[String(featureTypeValue)] || 'bg-white border-gray-300';
  };

  const getDeviceColor = (device?: any) => {
    if (!device) return 'bg-white border-gray-300';
    
    // Manejar array de dispositivos
    if (Array.isArray(device)) {
      // Para arrays, necesitamos el primer dispositivo o una lógica específica
      const firstDevice = device[0];
      const deviceValue = firstDevice?.value;
      if (!deviceValue) return 'bg-white border-gray-300';
      
      if (colorMappings.device && colorMappings.device[deviceValue]) {
        return colorMappings.device[deviceValue];
      }
      
      const colors: Record<string, string> = {
        'Web': 'bg-sky-200 border-sky-300',
        'Mobile': 'bg-violet-200 border-violet-300',
        'Backend': 'bg-lime-200 border-lime-300',
        'STB IPTV': 'bg-blue-200 border-blue-300',
        'Dongle OTT': 'bg-orange-200 border-orange-300',
        'SmartTV': 'bg-green-200 border-green-300',
        'AndroidTV': 'bg-red-200 border-red-300',
        'FireTV': 'bg-yellow-200 border-yellow-300',
        'AppleTV': 'bg-purple-200 border-purple-300',
        'Android': 'bg-pink-200 border-pink-300',
        'iOS': 'bg-indigo-200 border-indigo-300',
        'GVP': 'bg-teal-200 border-teal-300'
      };
      return colors[String(deviceValue)] || 'bg-white border-gray-300';
    }
    
    // Manejar objeto simple
    const deviceValue = typeof device === 'object' ? device.value?.value : device;
    if (!deviceValue) return 'bg-white border-gray-300';
    
    if (colorMappings.device && colorMappings.device[deviceValue]) {
      return colorMappings.device[deviceValue];
    }
    
    const colors: Record<string, string> = {
      'Web': 'bg-sky-200 border-sky-300',
      'Mobile': 'bg-violet-200 border-violet-300',
      'Backend': 'bg-lime-200 border-lime-300',
    };
    return colors[String(deviceValue)] || 'bg-white border-gray-300';
  };

  // Paleta de colores disponibles
  const colorPalette = [
    'bg-red-100 border-red-300',
    'bg-orange-100 border-orange-300',
    'bg-amber-100 border-amber-300',
    'bg-yellow-100 border-yellow-300',
    'bg-lime-100 border-lime-300',
    'bg-green-100 border-green-300',
    'bg-emerald-100 border-emerald-300',
    'bg-teal-100 border-teal-300',
    'bg-cyan-100 border-cyan-300',
    'bg-sky-100 border-sky-300',
    'bg-blue-100 border-blue-300',
    'bg-indigo-100 border-indigo-300',
    'bg-violet-100 border-violet-300',
    'bg-purple-100 border-purple-300',
    'bg-fuchsia-100 border-fuchsia-300',
    'bg-pink-100 border-pink-300',
    'bg-rose-100 border-rose-300',
    'bg-gray-100 border-gray-300',
    'bg-slate-100 border-slate-300',
    'bg-zinc-100 border-zinc-300',
  ];

  // Función para obtener colores pasteles por defecto
  const getDefaultColor = (index: number, total: number) => {
    const pastelColors = [
      'bg-red-200 border-red-300',
      'bg-orange-200 border-orange-300', 
      'bg-amber-200 border-amber-300',
      'bg-yellow-200 border-yellow-300',
      'bg-lime-200 border-lime-300',
      'bg-green-200 border-green-300',
      'bg-emerald-200 border-emerald-300',
      'bg-teal-200 border-teal-300',
      'bg-cyan-200 border-cyan-300',
      'bg-sky-200 border-sky-300',
      'bg-blue-200 border-blue-300',
      'bg-indigo-200 border-indigo-300',
      'bg-violet-200 border-violet-300',
      'bg-purple-200 border-purple-300',
      'bg-fuchsia-200 border-fuchsia-300',
      'bg-pink-200 border-pink-300',
      'bg-rose-200 border-rose-300',
      'bg-slate-200 border-slate-300',
      'bg-gray-200 border-gray-300',
      'bg-zinc-200 border-zinc-300',
    ];
    return pastelColors[index % pastelColors.length];
  };

  // Inicializar colores por defecto para la opción seleccionada
  const initializeDefaultColors = (option: string) => {
    // No inicializar colores para la opción "default"
    if (option === 'default') return;
    
    const values = getUniqueValues(option);
    const newMappings = { ...colorMappings };
    
    if (!newMappings[option]) {
      newMappings[option] = {};
      values.forEach((value, index) => {
        newMappings[option][value] = getDefaultColor(index, values.length);
      });
      setColorMappings(newMappings);
    }
  };

  // Función para actualizar el color de un valor
  const updateColorMapping = (option: string, value: string, color: string) => {
    setColorMappings(prev => ({
      ...prev,
      [option]: {
        ...prev[option],
        [value]: color
      }
    }));
    setShowColorPicker(null);
  };

  // Componente de selector de color circular
  const ColorPicker = ({ option, value }: { option: string; value: string }) => {
    const colors = [
      { hex: '#ef4444', name: 'Red', tailwind: 'bg-red-200 border-red-300' },
      { hex: '#f97316', name: 'Orange', tailwind: 'bg-orange-200 border-orange-300' },
      { hex: '#f59e0b', name: 'Amber', tailwind: 'bg-amber-200 border-amber-300' },
      { hex: '#eab308', name: 'Yellow', tailwind: 'bg-yellow-200 border-yellow-300' },
      { hex: '#84cc16', name: 'Lime', tailwind: 'bg-lime-200 border-lime-300' },
      { hex: '#22c55e', name: 'Green', tailwind: 'bg-green-200 border-green-300' },
      { hex: '#10b981', name: 'Emerald', tailwind: 'bg-emerald-200 border-emerald-300' },
      { hex: '#14b8a6', name: 'Teal', tailwind: 'bg-teal-200 border-teal-300' },
      { hex: '#06b6d4', name: 'Cyan', tailwind: 'bg-cyan-200 border-cyan-300' },
      { hex: '#0ea5e9', name: 'Sky', tailwind: 'bg-sky-200 border-sky-300' },
      { hex: '#3b82f6', name: 'Blue', tailwind: 'bg-blue-200 border-blue-300' },
      { hex: '#6366f1', name: 'Indigo', tailwind: 'bg-indigo-200 border-indigo-300' },
      { hex: '#8b5cf6', name: 'Violet', tailwind: 'bg-violet-200 border-violet-300' },
      { hex: '#a855f7', name: 'Purple', tailwind: 'bg-purple-200 border-purple-300' },
      { hex: '#d946ef', name: 'Fuchsia', tailwind: 'bg-fuchsia-200 border-fuchsia-300' },
      { hex: '#ec4899', name: 'Pink', tailwind: 'bg-pink-200 border-pink-300' },
      { hex: '#f43f5e', name: 'Rose', tailwind: 'bg-rose-200 border-rose-300' },
      { hex: '#64748b', name: 'Slate', tailwind: 'bg-slate-200 border-slate-300' },
      { hex: '#71717a', name: 'Gray', tailwind: 'bg-gray-200 border-gray-300' },
      { hex: '#18181b', name: 'Zinc', tailwind: 'bg-zinc-200 border-zinc-300' }
    ];

    return (
      <div className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 mt-6">
        <div className="grid grid-cols-5 gap-2 mb-3">
          {colors.map(color => (
            <button
              key={color.hex}
              onClick={() => updateColorMapping(option, value, color.tailwind)}
              className="w-8 h-8 rounded-full border-2 border-gray-200 cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Custom:</label>
          <input
            type="color"
            onChange={(e) => updateColorMapping(option, value, `bg-[${e.target.value}] border-[${e.target.value}]`)}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
            title="Choose custom color"
          />
        </div>
      </div>
    );
  };

  // Variables de estado
  const [initiativeRelations, setInitiativeRelations] = useState<any[]>([]);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [blocks, setBlocks] = useState<EpicBlock[]>([]);
  const [removedEpics, setRemovedEpics] = useState<Set<string>>(new Set());
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedEpic, setSelectedEpic] = useState<string | null>(null);
  const [showAppearancePanel, setShowAppearancePanel] = useState(false);
  const [colorBy, setColorBy] = useState('default'); // Opción por defecto cambiada a 'default'
  const [colorMappings, setColorMappings] = useState<Record<string, Record<string, string>>>({});
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [defaultEpicColor, setDefaultEpicColor] = useState('bg-blue-100 border-blue-300'); // Color por defecto para todas las epics
  const canvasRef = useRef<HTMLDivElement>(null);
  const prevEpicsRef = useRef<any[]>([]);
  const prevInitiativeRelationsRef = useRef<any[]>([]);

  // Función para procesar epics en bloques
  const processEpicsIntoBlocks = (epics: Epic[], initiativeRelations: any[]) => {
    console.log('🚀 Procesando', epics.length, 'epics');
    
    // Agrupar epics por release
    const epicsByRelease = new Map<string, Epic[]>();
    epics.forEach(epic => {
      const versions = epic.fields.fixVersions || [];
      if (versions.length > 0) {
        versions.forEach(version => {
          const versionName = version.name;
          if (!epicsByRelease.has(versionName)) {
            epicsByRelease.set(versionName, []);
          }
          epicsByRelease.get(versionName)!.push(epic);
        });
      } else {
        if (!epicsByRelease.has('Sin Release')) {
          epicsByRelease.set('Sin Release', []);
        }
        epicsByRelease.get('Sin Release')!.push(epic);
      }
    });

    // Ordenar releases alfabéticamente
    const sortedReleases = Array.from(epicsByRelease.keys()).sort();
    
    // Crear bloques organizados por releases en columnas
    const newBlocks: EpicBlock[] = [];
    const columnWidth = 220; // Ancho fijo
    const blockSpacing = 4; // Espaciado vertical entre epics (misma release)
    const columnSpacing = 12; // Espaciado horizontal entre releases
    const headerHeight = 35; // Espacio para la cabecera de release
    
    sortedReleases.forEach((releaseName, releaseIndex) => {
      const releaseEpics = epicsByRelease.get(releaseName)!;
      let currentY = 20 + headerHeight; // Posición Y inicial para esta columna
      
      releaseEpics.forEach((epic, epicIndex) => {
        // Calcular altura para esta card específica según sus datos reales
        const cardHeight = calculateEpicCardHeight(epic);
        
        console.log(`📍 Posicionando ${epic.key}:`, {
          epicIndex,
          currentY,
          cardHeight,
          nextY: currentY + cardHeight + blockSpacing
        });
        
        newBlocks.push({
          id: `${epic.key}-${epicIndex}`, // Key único con key + índice
          epic,
          x: 20 + (releaseIndex * (columnWidth + columnSpacing)), // Usar columnSpacing para espaciado horizontal
          y: currentY, // Usar posición Y acumulativa
          width: columnWidth, // Mismo ancho que las cabeceras
          height: cardHeight
        });
        
        // Actualizar posición Y para la siguiente card
        currentY += cardHeight + blockSpacing;
      });
    });
    
    return newBlocks;
  };

  // Función para posicionar bloques
  const positionBlocks = (blocks: EpicBlock[]) => {
    console.log('📍 Posicionando bloques...');
    // La lógica de posicionamiento ya está incluida en processEpicsIntoBlocks
  };

  // Efecto para inicializar colores cuando cambia la opción
  useEffect(() => {
    if (colorBy && epics.length > 0) {
      initializeDefaultColors(colorBy);
      
      // Forzar inicialización de colores para Devices si es la opción seleccionada
      if (colorBy === 'device') {
        const deviceValues = getUniqueValues('device');
        if (deviceValues.length > 0 && (!colorMappings.device || Object.keys(colorMappings.device).length === 0)) {
          const newMappings = { ...colorMappings };
          newMappings.device = {};
          deviceValues.forEach((value, index) => {
            newMappings.device[value] = getDefaultColor(index, deviceValues.length);
          });
          setColorMappings(newMappings);
          console.log('Debug - Colors initialized for devices:', newMappings.device);
        }
      }
    }
  }, [colorBy, epics.length]);
  // Calcular altura del canvas según las alturas reales de las cards
  const calculateCanvasHeight = () => {
    const epicsByRelease = new Map<string, Epic[]>();
    epics.forEach(epic => {
      const versions = epic.fields.fixVersions || [];
      if (versions.length > 0) {
        versions.forEach(version => {
          const versionName = version.name;
          if (!epicsByRelease.has(versionName)) {
            epicsByRelease.set(versionName, []);
          }
          epicsByRelease.get(versionName)!.push(epic);
        });
      } else {
        if (!epicsByRelease.has('Sin Release')) {
          epicsByRelease.set('Sin Release', []);
        }
        epicsByRelease.get('Sin Release')!.push(epic);
      }
    });
    
    // Calcular altura total para cada columna
    const columnHeights = Array.from(epicsByRelease.values()).map(releaseEpics => {
      const headerHeight = 35;
      const blockSpacing = 4; // Espaciado vertical entre epics
      
      // Sumar alturas reales de todos los epics en esta columna
      let totalEpicsHeight = 0;
      releaseEpics.forEach(epic => {
        totalEpicsHeight += calculateEpicCardHeight(epic);
      });
      
      // Añadir espaciado entre epics (menos el último)
      const totalSpacing = (releaseEpics.length - 1) * blockSpacing;
      
      return headerHeight + totalEpicsHeight + totalSpacing;
    });
    
    // Usar la altura máxima de todas las columnas
    const maxColumnHeight = Math.max(...columnHeights, 0);
    
    // Añadir padding y espacio para leyenda
    const topPadding = 20;
    const bottomPadding = 50;
    const legendHeight = getColorLegend() ? 80 : 0;
    
    return Math.max(1200, topPadding + maxColumnHeight + bottomPadding + legendHeight);
  };

  // Función para calcular el alto dinámico de las cards según los campos visibles
  const calculateCardHeight = () => {
    let height = 0;
    
    // Altura base para padding y bordes
    height += 16; // padding general
    
    // Altura según campos visibles
    if (cardFields.title) {
      height += 30; // altura para título (2 líneas posibles)
    }
    
    if (cardFields.shortDescription) {
      height += 20; // altura para descripción (2 líneas posibles)
    }
    
    if (cardFields.image) {
      height += 40; // altura para imagen (40px)
    }
    
    if (cardFields.labels) {
      height += 20; // altura para labels (1 línea)
    }
    
    if (cardFields.obReach) {
      height += 24; // altura para logo OB Reach (24px)
    }
    
    // Espaciado entre campos (4px = mb-1)
    const visibleFieldsCount = Object.values(cardFields).filter(Boolean).length;
    height += (visibleFieldsCount - 1) * 4; // 4px entre campos
    
    return Math.max(60, height); // mínimo 60px
  };

  // Función para calcular la altura de una card específica basada en sus datos reales
  const calculateEpicCardHeight = (epic: Epic) => {
    let height = 16; // padding base
    
    // Altura base para título (siempre presente)
    height += 30; // título
    
    // Altura adicional para otros campos
    if (epic.fields.customfield_29702) height += 20; // descripción
    if (epic.fields.customfield_29704) height += 40; // imagen
    if (epic.fields.labels && epic.fields.labels.length > 0) height += 20; // labels
    if (epic.fields.customfield_21801 && epic.fields.customfield_21801.length > 0) height += 24; // OB Reach
    
    // Espaciado entre campos (4px cada uno)
    let visibleFieldsCount = 1; // siempre cuenta el título
    if (epic.fields.customfield_29702) visibleFieldsCount++;
    if (epic.fields.customfield_29704) visibleFieldsCount++;
    if (epic.fields.labels && epic.fields.labels.length > 0) visibleFieldsCount++;
    if (epic.fields.customfield_21801 && epic.fields.customfield_21801.length > 0) visibleFieldsCount++;
    
    height += (visibleFieldsCount - 1) * 4; // 4px entre campos
    
    const finalHeight = Math.max(60, height);
    
    console.log(`🔍 Altura calculada para ${epic.key}:`, {
      summary: epic.fields.summary,
      hasDescription: !!epic.fields.customfield_29702,
      hasLabels: !!(epic.fields.labels && epic.fields.labels.length > 0),
      hasObReach: !!(epic.fields.customfield_21801 && epic.fields.customfield_21801.length > 0),
      visibleFieldsCount,
      calculatedHeight: height,
      finalHeight
    });
    
    return finalHeight;
  };
  
  // Calcular anchura dinámica del canvas según el número de releases
  const calculateCanvasWidth = () => {
    const epicsByRelease = new Map<string, Epic[]>();
    epics.forEach(epic => {
      const versions = epic.fields.fixVersions || [];
      if (versions.length > 0) {
        versions.forEach(version => {
          const versionName = version.name;
          if (!epicsByRelease.has(versionName)) {
            epicsByRelease.set(versionName, []);
          }
          epicsByRelease.get(versionName)!.push(epic);
        });
      } else {
        if (!epicsByRelease.has('Sin Release')) {
          epicsByRelease.set('Sin Release', []);
        }
        epicsByRelease.get('Sin Release')!.push(epic);
      }
    });
    
    const numberOfReleases = epicsByRelease.size;
    const columnWidth = 220; // Ancho fijo
    const columnSpacing = 12; // Espaciado horizontal entre releases
    const horizontalPadding = 40; // 20px a cada lado
    
    return Math.max(800, horizontalPadding + (numberOfReleases * (columnWidth + columnSpacing)) - columnSpacing);
  };

  const canvasHeight = calculateCanvasHeight();
  const canvasWidth = calculateCanvasWidth();

  const openEpicInJira = (epicKey: string) => {
    window.open(`https://jira.tid.es/browse/${epicKey}`, '_blank');
  };

  // Cerrar popup al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedEpic && !(event.target as HTMLElement).closest('.epic-block')) {
        setSelectedEpic(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [selectedEpic]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedFixVersions.length > 0) params.set('fixVersions', selectedFixVersions.join(','));
    if (selectedInitiatives.length > 0) params.set('initiatives', selectedInitiatives.join(','));
    if (selectedThemes.length > 0) params.set('themes', selectedThemes.join(','));
    if (selectedDevices.length > 0) params.set('devices', selectedDevices.join(','));
    if (selectedFeatureTypes.length > 0) params.set('featureTypes', selectedFeatureTypes.join(','));
    if (selectedObReaches.length > 0) params.set('obReaches', selectedObReaches.join(','));
    if (selectedSponsors.length > 0) params.set('sponsors', selectedSponsors.join(','));
    if (selectedStatuses.length > 0) params.set('statuses', selectedStatuses.join(','));
    if (selectedAssignees.length > 0) params.set('assignees', selectedAssignees.join(','));
    if (selectedLabels.length > 0) params.set('labels', selectedLabels.join(','));
    
    console.log('FRONTEND - selectedThemes:', selectedThemes);
    console.log('FRONTEND - params.toString():', params.toString());
    
    fetch(`/api/jira/epics${params.toString() ? `?${params.toString()}` : ''}`)
      .then(res => res.json())
      .then(data => {
        console.log('Datos recibidos de la API:', data);
        
        setEpics(data.epics || []);
        console.log('📊 setEpics llamado con:', data.epics?.length || 0, 'epics');
        
        setFixVersionOptions(data.fixVersionsAll || []);
        setInitiatives(data.initiativesAll || []);
        console.log('🎯 setInitiatives llamado con:', data.initiativesAll?.length || 0, 'initiatives');
        
        setThemes(data.themesAll || []);
        setDevices(data.devicesAll || []);
        setFeatureTypes(data.featureTypesAll || []);
        setObReaches(data.obReachesAll || []);
        setSponsors(data.sponsorsAll || []);
        setStatuses(data.statusesAll || []);
        setAssignees(data.assigneesAll || []);
        setLabels(data.labelsAll || []);
        
        // Procesar initiatives
        const initiativesData = (data.initiativesAll || []).map((init: any) => ({
          id: init.id,
          key: init.key,
          summary: init.fields?.summary || 'Sin nombre'
        }));
        
        // Combinar initiatives originales con las hijas de themes
        const themeInitiativesData = (data.themeInitiatives || []).map((init: any) => ({
          id: init.id,
          key: init.key,
          summary: init.fields?.summary || 'Sin nombre'
        }));
        
        const allInitiatives = [...initiativesData, ...themeInitiativesData];
        
        console.log('🎯 setInitiativeRelations llamado con:', allInitiatives.length, 'relations');
        setInitiativeRelations(allInitiatives);
        
        // Procesar initiatives
        const uniqueInitiatives = allInitiatives.filter((init, index, self) => 
          index === self.findIndex(i => i.key === init.key)
        );
        
        console.log('Initiatives procesadas:', uniqueInitiatives);
        setInitiatives(uniqueInitiatives);
        
        // Procesar themes
        const themesData = (data.themesAll || []).map((theme: any) => ({
          id: theme.id,
          key: theme.key,
          summary: theme.summary || theme.fields?.summary || 'Sin nombre'
        }));
        
        console.log('Themes procesados:', themesData);
        setThemes(themesData);
        
        // Procesar devices
        const devicesData = (data.devicesAll || []).map((device: any) => ({
          id: device.id || `device-${Math.random()}`,
          value: device.value || '',
          name: device.name || device.value || 'Sin nombre'
        }));
        
        console.log('Devices procesados:', devicesData);
        setDevices(devicesData);
        
        // Procesar relaciones de initiatives
        setInitiativeRelations(data.initiativeRelations || []);
        
        console.log('🔥 ANTES DEL setTimeout - initiativeRelations:', data.initiativeRelations?.length || 0);
        
        // Forzar actualización después de cargar datos para asegurar que el useEffect se dispare
        setTimeout(() => {
          console.log('🔄🔄🔄 setTimeout EJECUTADO - Forzando actualización de useEffect');
          setForceUpdate(prev => {
            console.log('🔄🔄🔄 forceUpdate incrementado de', prev, 'a', prev + 1);
            return prev + 1;
          });
        }, 100);
        
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [selectedFixVersions, selectedInitiatives, selectedThemes, selectedDevices, selectedFeatureTypes, selectedObReaches, selectedSponsors, selectedStatuses, selectedAssignees, selectedLabels]);

  useEffect(() => {
    console.log('🔄 useEffect de blocks ejecutándose:', { 
      epicsCount: epics.length, 
      initiativeRelationsCount: initiativeRelations.length 
    });
    
    if (epics.length === 0) {
      console.log('⏸️ No hay epics, esperando datos...');
      return;
    }

    // Verificar si los datos realmente cambiaron
    const prevEpicsLength = prevEpicsRef.current.length;
    const prevInitiativesLength = prevInitiativeRelationsRef.current.length;
    const epicsChanged = prevEpicsLength !== epics.length || prevInitiativesLength !== initiativeRelations.length;
    
    console.log('🔍 Epics cambiaron:', { 
      epicsCount: epics.length, 
      initiativeRelationsCount: initiativeRelations.length, 
      epicsChanged,
      prevEpicsLength,
      prevInitiativesLength
    });

    if (epicsChanged) {
      const newBlocks = processEpicsIntoBlocks(epics, initiativeRelations);
      positionBlocks(newBlocks);
      setBlocks(newBlocks);
      
      // Actualizar referencias
      prevEpicsRef.current = [...epics];
      prevInitiativeRelationsRef.current = [...initiativeRelations];
    }
  }, [epics, initiativeRelations, forceUpdate]);

  // Debug: Verificar cambios en epics
  useEffect(() => {
    console.log('🔍 Epics cambiaron:', { 
      epicsCount: epics.length, 
      initiativeRelationsCount: initiativeRelations.length,
      epicsChanged: epics.length > 0
    });
  }, [epics, initiativeRelations]);

  const moveEpicUp = (epicId: string) => {
    const currentBlock = blocks.find(b => b.id === epicId);
    if (!currentBlock) return;
    
    // Encontrar epics en la misma columna (mismo x)
    const epicsInColumn = blocks
      .filter(b => b.x === currentBlock.x)
      .sort((a, b) => a.y - b.y);
    
    const currentIndex = epicsInColumn.findIndex(b => b.id === epicId);
    
    // Solo puede subir si no es la primera
    if (currentIndex > 0) {
      const epicAbove = epicsInColumn[currentIndex - 1];
      
      // Intercambiar posiciones
      setBlocks(prevBlocks => 
        prevBlocks.map(block => {
          if (block.id === epicId) {
            return { ...block, y: epicAbove.y };
          } else if (block.id === epicAbove.id) {
            return { ...block, y: currentBlock.y };
          }
          return block;
        })
      );
    }
  };

  const moveEpicDown = (epicId: string) => {
    const currentBlock = blocks.find(b => b.id === epicId);
    if (!currentBlock) return;
    
    // Encontrar epics en la misma columna (mismo x)
    const epicsInColumn = blocks
      .filter(b => b.x === currentBlock.x)
      .sort((a, b) => a.y - b.y);
    
    const currentIndex = epicsInColumn.findIndex(b => b.id === epicId);
    
    // Solo puede bajar si no es la última
    if (currentIndex < epicsInColumn.length - 1) {
      const epicBelow = epicsInColumn[currentIndex + 1];
      
      // Intercambiar posiciones
      setBlocks(prevBlocks => 
        prevBlocks.map(block => {
          if (block.id === epicId) {
            return { ...block, y: epicBelow.y };
          } else if (block.id === epicBelow.id) {
            return { ...block, y: currentBlock.y };
          }
          return block;
        })
      );
    }
  };

  const handleMouseDown = (e: React.MouseEvent, blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    setDragging(blockId);
    setDragOffset({
      x: e.clientX - rect.left - block.x,
      y: e.clientY - rect.top - block.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;
    
    setBlocks(prev => prev.map(block => 
      block.id === dragging 
        ? { ...block, x: Math.max(0, Math.min(newX, rect.width - block.width)), 
            y: Math.max(0, Math.min(newY, rect.height - block.height)) }
        : block
    ));
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const toggleEpicRemoval = (epicId: string) => {
    setRemovedEpics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(epicId)) {
        newSet.delete(epicId);
      } else {
        newSet.add(epicId);
      }
      return newSet;
    });
  };

  const handleFixVersionChange = (version: string) => {
    setSelectedFixVersions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(version)) {
        newSet.delete(version);
      } else {
        newSet.add(version);
      }
      return Array.from(newSet);
    });
  };

  const handleThemeChange = (themeKey: string) => {
    setSelectedThemes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(themeKey)) {
        newSet.delete(themeKey);
      } else {
        newSet.add(themeKey);
      }
      return Array.from(newSet);
    });
  };

  const handleDeviceChange = (device: string) => {
    setSelectedDevices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(device)) {
        newSet.delete(device);
      } else {
        newSet.add(device);
      }
      return Array.from(newSet);
    });
  };

  const exportToSVGFiltered = async () => {
    if (!canvasRef.current) return;
    
    try {
      console.log('Iniciando exportación a PNG filtrado...');
      
      // Guardar estado original de todos los elementos
      const removedElements = canvasRef.current.querySelectorAll('.epic-removed, .removed-section');
      const xButtons = canvasRef.current.querySelectorAll('.export-hidden');
      const visibleEpics = Array.from(canvasRef.current.querySelectorAll('.epic-block:not(.epic-removed)')) as HTMLElement[];
      const releaseHeaders = Array.from(canvasRef.current.querySelectorAll('.absolute.bg-blue-500')) as HTMLElement[];
      
      // Guardar posiciones originales
      const originalPositions = new Map<HTMLElement, {top: string, left: string, display: string}>();
      
      // Ocultar elementos eliminados y sección de eliminados
      removedElements.forEach(el => {
        const htmlEl = el as HTMLElement;
        originalPositions.set(htmlEl, {top: htmlEl.style.top, left: htmlEl.style.left, display: htmlEl.style.display});
        htmlEl.style.display = 'none';
      });
      
      // Ocultar botones X
      xButtons.forEach(button => {
        const htmlBtn = button as HTMLElement;
        originalPositions.set(htmlBtn, {top: htmlBtn.style.top, left: htmlBtn.style.left, display: htmlBtn.style.display});
        htmlBtn.style.display = 'none';
      });
      
      // Guardar posiciones originales de epics visibles
      visibleEpics.forEach(epic => {
        originalPositions.set(epic, {top: epic.style.top, left: epic.style.left, display: epic.style.display});
      });
      
      // Guardar posiciones originales de cabeceras de releases
      releaseHeaders.forEach(header => {
        originalPositions.set(header, {top: header.style.top, left: header.style.left, display: header.style.display});
      });
      
      // Reorganizar epics verticalmente para rellenar huecos
      reorganizeVerticalLayoutInPlace();
      
      // Ajustar posición de la leyenda dinámicamente
      const legendElement = canvasRef.current.querySelector('[data-legend]') as HTMLElement;
      if (legendElement) {
        const visibleEpicsForLegend = Array.from(canvasRef.current.querySelectorAll('.epic-block:not(.epic-removed)')) as HTMLElement[];
        if (visibleEpicsForLegend.length > 0) {
          // Encontrar la epic con el Y más bajo
          const maxY = Math.max(...visibleEpicsForLegend.map(epic => {
            const top = parseFloat(epic.style.top) || 0;
            const height = epic.offsetHeight;
            return top + height;
          }));
          
          // Posicionar la leyenda unos píxeles por debajo de la última epic
          const spacing = 15; // Píxeles de separación
          legendElement.style.top = `${maxY + spacing}px`;
          legendElement.style.position = 'absolute';
          legendElement.style.left = '0';
          legendElement.style.right = '0';
          
          console.log(`Leyenda posicionada en Y: ${maxY + spacing}px (última epic en Y: ${maxY}px)`);
        }
      }
      
      // Generar PNG desde el estado filtrado con fondo transparente
      console.log('Generando PNG filtrado con fondo transparente...');
      const pngDataUrl = await toPng(canvasRef.current, {
        quality: 0.95,
        width: canvasRef.current.offsetWidth * 2, // Mayor calidad
        height: canvasRef.current.offsetHeight * 2,
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
          backgroundColor: 'transparent'
        },
        // Fondo transparente para PowerPoint
        bgcolor: 'transparent'
      });
      
      console.log('PNG filtrado generado, length:', pngDataUrl.length);
      
      // Restaurar estado original
      originalPositions.forEach((original, element) => {
        element.style.top = original.top;
        element.style.left = original.left;
        element.style.display = original.display;
      });
      
      // Descargar el PNG filtrado directamente
      const pngLink = document.createElement('a');
      pngLink.download = 'swimlane-roadmap-filtrado.png';
      pngLink.href = pngDataUrl;
      pngLink.click();
      
      console.log('Exportación PNG filtrado completada');
      
    } catch (error) {
      console.error('Error detallado exportando a PNG filtrado:', error);
      alert(`Error al exportar PNG: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const reorganizeVerticalLayoutInPlace = () => {
    console.log('=== INICIO REORGANIZACIÓN VERTICAL IN PLACE ===');
    
    // Obtener cabeceras y epics del canvas real
    const releaseHeaders = Array.from(canvasRef.current!.querySelectorAll('.absolute.bg-blue-500')) as HTMLElement[];
    const visibleEpics = Array.from(canvasRef.current!.querySelectorAll('.epic-block:not(.epic-removed)')) as HTMLElement[];
    
    console.log('Cabeceras encontradas:', releaseHeaders.length);
    console.log('Epics visibles:', visibleEpics.length);
    
    // Agrupar epics por release (columna)
    const epicsByColumn = new Map<HTMLElement, HTMLElement[]>();
    
    releaseHeaders.forEach(header => {
      const headerLeft = parseFloat(header.style.left) || 0;
      console.log(`Cabecera: left=${headerLeft}, text="${header.textContent?.trim()}"`);
      
      // Encontrar epics en esta columna
      const columnEpics = visibleEpics.filter(epic => {
        const epicLeft = parseFloat(epic.style.left) || 0;
        return Math.abs(epicLeft - headerLeft) < 50; // Misma columna
      }).sort((a, b) => {
        // Ordenar por posición Y (de arriba a abajo)
        const topA = parseFloat(a.style.top) || 0;
        const topB = parseFloat(b.style.top) || 0;
        return topA - topB;
      });
      
      console.log(`  -> Epics en esta columna: ${columnEpics.length}`);
      columnEpics.forEach((epic, index) => {
        console.log(`    Epic ${index}: top=${epic.style.top}, text="${epic.textContent?.substring(0, 30)}..."`);
      });
      
      epicsByColumn.set(header, columnEpics);
    });
    
    // Filtrar releases que tienen epics (eliminar vacías)
    const nonEmptyReleases = Array.from(epicsByColumn.entries())
      .filter(([_, epics]) => epics.length > 0);
    
    console.log('Releases con epics:', nonEmptyReleases.length);
    
    // Ocultar releases vacías completamente
    releaseHeaders.forEach(header => {
      const epics = epicsByColumn.get(header);
      if (!epics || epics.length === 0) {
        header.style.display = 'none';
        console.log(`Ocultando release vacía: ${header.textContent?.trim()}`);
      }
    });
    
    // Reorganizar releases y epics para eliminar huecos horizontales
    const columnWidth = 220;
    const blockSpacing = 15;
    const headerHeight = 35;
    const blockHeight = 100;
    
    nonEmptyReleases.forEach(([header, epics], releaseIndex) => {
      const newLeft = 20 + (releaseIndex * (columnWidth + blockSpacing));
      const oldLeft = parseFloat(header.style.left) || 0;
      
      console.log(`Moviendo release "${header.textContent?.trim()}": ${oldLeft} -> ${newLeft}`);
      header.style.left = `${newLeft}px`;
      
      // Mover epics de ESTA release a la nueva posición de la columna
      epics.forEach((epic, epicIndex) => {
        const newTop = 20 + headerHeight + (epicIndex * (blockHeight + blockSpacing));
        const oldTop = parseFloat(epic.style.top) || 0;
        
        console.log(`  Epic ${epicIndex}: left=${oldLeft} -> ${newLeft}, top=${oldTop} -> ${newTop}`);
        epic.style.left = `${newLeft}px`;
        epic.style.top = `${newTop}px`;
      });
    });
    
    console.log('=== FIN REORGANIZACIÓN VERTICAL IN PLACE ===');
  };

  const reorganizeLayoutForExport = (canvas: HTMLElement) => {
    console.log('=== INICIO REORGANIZACIÓN ===');
    
    // Obtener coordenadas del canvas real para el cálculo
    const realCanvas = canvasRef.current!;
    const realCanvasRect = realCanvas.getBoundingClientRect();
    
    // Obtener todas las cabeceras de releases y epics visibles del canvas real
    const releaseHeaders = Array.from(realCanvas.querySelectorAll('.absolute.bg-blue-500')) as HTMLElement[];
    const visibleEpics = Array.from(realCanvas.querySelectorAll('.absolute.bg-white.border-gray-300:not(.epic-removed)')) as HTMLElement[];
    
    console.log('Canvas real - Cabeceras encontradas:', releaseHeaders.length);
    console.log('Canvas real - Epics visibles:', visibleEpics.length);
    
    // Agrupar epics por release usando coordenadas relativas
    const epicsByRelease = new Map<HTMLElement, HTMLElement[]>();
    
    releaseHeaders.forEach((header, index) => {
      const headerLeft = parseFloat(header.style.left) || 0;
      console.log(`Cabecera ${index}: left=${headerLeft}, text="${header.textContent}"`);
      
      const epicsUnderHeader = visibleEpics.filter(epic => {
        const epicLeft = parseFloat(epic.style.left) || 0;
        return Math.abs(epicLeft - headerLeft) < 50; // Epics en la misma columna
      });
      
      console.log(`  -> Epics bajo esta cabecera: ${epicsUnderHeader.length}`);
      epicsByRelease.set(header, epicsUnderHeader);
    });
    
    // Eliminar releases vacías
    const nonEmptyReleases = Array.from(epicsByRelease.entries())
      .filter(([_, epics]) => epics.length > 0);
    
    console.log('Releases no vacías:', nonEmptyReleases.length);
    
    // Reorganizar releases y epics sin huecos
    const columnWidth = 220;
    const blockSpacing = 15;
    const headerHeight = 35;
    const blockHeight = 100;
    
    // Aplicar cambios al canvas clonado
    const clonedHeaders = Array.from(canvas.querySelectorAll('.absolute.bg-blue-500')) as HTMLElement[];
    const clonedEpics = Array.from(canvas.querySelectorAll('.absolute.bg-white.border-gray-300:not(.epic-removed)')) as HTMLElement[];
    
    console.log('Canvas clonado - Cabeceras:', clonedHeaders.length, 'Epics:', clonedEpics.length);
    
    // Crear mapa de elementos clonados por sus posiciones originales
    const clonedHeaderMap = new Map<number, HTMLElement>();
    const clonedEpicMap = new Map<string, HTMLElement>();
    
    clonedHeaders.forEach(header => {
      const left = parseFloat(header.style.left) || 0;
      clonedHeaderMap.set(left, header);
      console.log(`Cabecera clonada mapeada: left=${left}`);
    });
    
    clonedEpics.forEach(epic => {
      const epicId = epic.getAttribute('data-epic-id');
      console.log(`Epic clonado: id="${epicId}", left=${epic.style.left}`);
      if (epicId) clonedEpicMap.set(epicId, epic);
    });
    
    nonEmptyReleases.forEach(([originalHeader, originalEpics], releaseIndex) => {
      const originalLeft = parseFloat(originalHeader.style.left) || 0;
      const clonedHeader = clonedHeaderMap.get(originalLeft);
      
      console.log(`Procesando release ${releaseIndex}: originalLeft=${originalLeft}, clonedHeader encontrado=${!!clonedHeader}`);
      
      if (clonedHeader) {
        // Mover cabecera clonada
        const newLeft = 20 + (releaseIndex * (columnWidth + blockSpacing));
        clonedHeader.style.left = `${newLeft}px`;
        console.log(`  -> Cabecera movida a left=${newLeft}`);
        
        // Mover epics clonados compactos sin huecos
        originalEpics.forEach((originalEpic, epicIndex) => {
          const epicId = originalEpic.getAttribute('data-epic-id');
          const clonedEpic = clonedEpicMap.get(epicId || '');
          
          console.log(`    Epic ${epicIndex}: id="${epicId}", clonado encontrado=${!!clonedEpic}`);
          
          if (clonedEpic) {
            clonedEpic.style.left = `${newLeft}px`;
            clonedEpic.style.top = `${20 + headerHeight + (epicIndex * (blockHeight + blockSpacing))}px`;
            console.log(`      -> Epic movido a left=${newLeft}, top=${clonedEpic.style.top}`);
          }
        });
      }
    });
    
    // Ocultar releases clonados que quedaron vacíos
    clonedHeaders.forEach(header => {
      const left = parseFloat(header.style.left) || 0;
      const originalHeader = releaseHeaders.find(h => Math.abs((parseFloat(h.style.left) || 0) - left) < 10);
      
      if (originalHeader && (!epicsByRelease.has(originalHeader) || epicsByRelease.get(originalHeader)!.length === 0)) {
        header.style.display = 'none';
        console.log(`Cabecera vacía ocultada: left=${left}`);
      }
    });
    
    console.log('=== FIN REORGANIZACIÓN ===');
  };

  if (loading) return <div className="p-8">Loading epics...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Visual Roadmap Swimlane</h1>
      
      {/* Filtros y exportación */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Botón Customize Card - a la izquierda de Filters */}
        <button
          onClick={() => setShowCustomizeCard(true)}
          className="p-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors flex items-center justify-center"
          title="Customize Card"
        >
          <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L15 5.586V9a1 1 0 102 0v-.586l-1.414 1.414a2 2 0 01-2.828 0L12 5.586V9a1 1 0 102 0v-.586l-1.414 1.414a2 2 0 01-2.828 0L8 5.586V9a1 1 0 102 0v-.586L6.586 9.414a2 2 0 01-2.828 0L4 7.586V9a1 1 0 102 0v-.586L2.586 9.414a2 2 0 01-2.828 0L0 7.586V9a1 1 0 102 0v-.586z" />
          </svg>
        </button>

        {/* Botón Filters - a la derecha de Customize Card */}
        <button
          onClick={() => {
            setShowFilterManager(true);
          }}
          className="p-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors flex items-center justify-center"
          title="Filters"
        >
          <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17a1 1 0 001 1h12a1 1 0 001-1v-6.586a1 1 0 00-.293-.707l-6.414-6.414A1 1 0 0018 6.586V4z" />
          </svg>
        </button>

        {/* Filtros activos - en el centro */}
        {isFilterEnabled('releases') && (
          <div className="flex-shrink-0">
            <FilterDropdown
              title="Releases"
              options={fixVersionOptions.map(version => ({
                id: version.id,
                value: version.name,
                summary: version.name
              }))}
              selectedValues={selectedFixVersions}
              onChange={setSelectedFixVersions}
              onRemove={() => removeFilter('releases')}
            />
          </div>
        )}

        {isFilterEnabled('initiatives') && (
          <div className="flex-shrink-0">
            <FilterDropdown
              title="Initiatives"
              options={initiatives.map(init => ({
                id: init.id,
                key: init.key,
                value: init.key,
                summary: init.summary
              }))}
              selectedValues={selectedInitiatives}
              onChange={setSelectedInitiatives}
              onRemove={() => removeFilter('initiatives')}
            />
          </div>
        )}

        {isFilterEnabled('themes') && (
          <div className="flex-shrink-0">
            <FilterDropdown
              title="Themes"
              options={themes.map(theme => ({
                id: theme.id,
                key: theme.key,
                value: theme.key,
                summary: theme.summary
              }))}
              selectedValues={selectedThemes}
              onChange={setSelectedThemes}
              onRemove={() => removeFilter('themes')}
            />
          </div>
        )}

        {isFilterEnabled('devices') && (
          <div className="flex-shrink-0">
            <FilterDropdown
              title="Devices & Platform"
              options={devices.map(device => ({
                id: device.id,
                value: device.value,
                summary: device.name
              }))}
              selectedValues={selectedDevices}
              onChange={setSelectedDevices}
              onRemove={() => removeFilter('devices')}
            />
          </div>
        )}

        {isFilterEnabled('featureTypes') && (
          <div className="flex-shrink-0">
            <FilterDropdown
              title="Feature Type"
              options={featureTypes.map(featureType => ({
                id: featureType.id,
                value: featureType.value,
                summary: featureType.name
              }))}
              selectedValues={selectedFeatureTypes}
              onChange={setSelectedFeatureTypes}
              onRemove={() => removeFilter('featureTypes')}
            />
          </div>
        )}

        {isFilterEnabled('obReaches') && (
          <div className="flex-shrink-0">
            <FilterDropdown
              title="OB Reach"
              options={obReaches.map(obReach => ({
                id: obReach.id,
                value: obReach.value,
                summary: obReach.name
              }))}
              selectedValues={selectedObReaches}
              onChange={setSelectedObReaches}
              onRemove={() => removeFilter('obReaches')}
            />
          </div>
        )}

        {isFilterEnabled('sponsors') && (
          <div className="flex-shrink-0">
            <FilterDropdown
              title="Sponsor"
              options={sponsors.map(sponsor => ({
                id: sponsor.id,
                value: sponsor.value,
                summary: sponsor.name
              }))}
              selectedValues={selectedSponsors}
              onChange={setSelectedSponsors}
              onRemove={() => removeFilter('sponsors')}
            />
          </div>
        )}

        {isFilterEnabled('statuses') && (
          <div className="flex-shrink-0">
            <FilterDropdown
              title="Status"
              options={statuses.map(status => ({
                id: status.id,
                value: status.value,
                summary: status.name
              }))}
              selectedValues={selectedStatuses}
              onChange={setSelectedStatuses}
              onRemove={() => removeFilter('statuses')}
            />
          </div>
        )}

        {isFilterEnabled('assignees') && (
          <div className="flex-shrink-0">
            <FilterDropdown
              title="Assignee"
              options={assignees.map(assignee => ({
                id: assignee.id,
                value: assignee.value,
                summary: assignee.name
              }))}
              selectedValues={selectedAssignees}
              onChange={setSelectedAssignees}
              onRemove={() => removeFilter('assignees')}
            />
          </div>
        )}

        {isFilterEnabled('labels') && (
          <div className="flex-shrink-0">
            <FilterDropdown
              title="Labels"
              options={labels.map(label => ({
                id: label.id,
                value: label.value,
                summary: label.name
              }))}
              selectedValues={selectedLabels}
              onChange={setSelectedLabels}
              onRemove={() => removeFilter('labels')}
            />
          </div>
        )}

        {/* Botón Exportar - a la derecha */}
        <button
          onClick={exportToSVGFiltered}
          className="p-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors flex items-center justify-center ml-auto"
          title="Export to PNG"
        >
          <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* Layout principal con canvas y panel lateral */}
      <div className="flex gap-4">
        {/* Panel lateral de apariencia - ahora a la izquierda */}
        <div className="relative flex-shrink-0">
          {/* Botón para abrir/cerrar panel */}
          <button
            onClick={() => setShowAppearancePanel(!showAppearancePanel)}
            className={`absolute ${showAppearancePanel ? '-right-8' : 'right-0'} top-0 p-1 border border-gray-300 rounded-r-md bg-white hover:bg-gray-50 transition-colors z-10`}
            title="Appearance Settings"
          >
            <svg 
              className={`w-3 h-3 text-gray-600 transition-transform ${showAppearancePanel ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Panel desplegable */}
          {showAppearancePanel && (
            <div className="w-80 bg-white border border-gray-300 rounded-r-lg shadow-lg p-4 max-h-96 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Appearance</h3>
              
              {/* Color by */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Color by
                </label>
                <select
                  value={colorBy}
                  onChange={(e) => setColorBy(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="default">Default</option>
                  <option value="status">Status</option>
                  <option value="assignee">Assignee</option>
                  <option value="featureType">Feature Type</option>
                </select>
              </div>

              {/* Opción Default */}
              {colorBy === 'default' && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-xs font-medium text-gray-700 mb-3">
                    Default Epic Color
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-700">
                      Apply to all epics
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Cuadrado de color actual */}
                      <button
                        onClick={() => setShowColorPicker(showColorPicker === 'default' ? null : 'default')}
                        className={`w-6 h-6 rounded-full border-2 ${defaultEpicColor} cursor-pointer hover:opacity-80 transition-opacity`}
                        title="Change default epic color"
                      />
                      
                      {/* Selector de color circular */}
                      {showColorPicker === 'default' && (
                        <div className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 mt-6">
                          <div className="grid grid-cols-5 gap-2 mb-3">
                            {[
                              { hex: '#ef4444', name: 'Red', tailwind: 'bg-red-200 border-red-300' },
                              { hex: '#f97316', name: 'Orange', tailwind: 'bg-orange-200 border-orange-300' },
                              { hex: '#f59e0b', name: 'Amber', tailwind: 'bg-amber-200 border-amber-300' },
                              { hex: '#eab308', name: 'Yellow', tailwind: 'bg-yellow-200 border-yellow-300' },
                              { hex: '#84cc16', name: 'Lime', tailwind: 'bg-lime-200 border-lime-300' },
                              { hex: '#22c55e', name: 'Green', tailwind: 'bg-green-200 border-green-300' },
                              { hex: '#10b981', name: 'Emerald', tailwind: 'bg-emerald-200 border-emerald-300' },
                              { hex: '#14b8a6', name: 'Teal', tailwind: 'bg-teal-200 border-teal-300' },
                              { hex: '#06b6d4', name: 'Cyan', tailwind: 'bg-cyan-200 border-cyan-300' },
                              { hex: '#0ea5e9', name: 'Sky', tailwind: 'bg-sky-200 border-sky-300' },
                              { hex: '#3b82f6', name: 'Blue', tailwind: 'bg-blue-200 border-blue-300' },
                              { hex: '#6366f1', name: 'Indigo', tailwind: 'bg-indigo-200 border-indigo-300' },
                              { hex: '#8b5cf6', name: 'Violet', tailwind: 'bg-violet-200 border-violet-300' },
                              { hex: '#a855f7', name: 'Purple', tailwind: 'bg-purple-200 border-purple-300' },
                              { hex: '#d946ef', name: 'Fuchsia', tailwind: 'bg-fuchsia-200 border-fuchsia-300' },
                              { hex: '#ec4899', name: 'Pink', tailwind: 'bg-pink-200 border-pink-300' },
                              { hex: '#f43f5e', name: 'Rose', tailwind: 'bg-rose-200 border-rose-300' },
                              { hex: '#64748b', name: 'Slate', tailwind: 'bg-slate-200 border-slate-300' },
                              { hex: '#71717a', name: 'Gray', tailwind: 'bg-gray-200 border-gray-300' },
                              { hex: '#18181b', name: 'Zinc', tailwind: 'bg-zinc-200 border-zinc-300' }
                            ].map(color => (
                              <button
                                key={color.hex}
                                onClick={() => {
                                  setDefaultEpicColor(color.tailwind);
                                  setShowColorPicker(null);
                                }}
                                className="w-8 h-8 rounded-full border-2 border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600">Custom:</label>
                            <input
                              type="color"
                              onChange={(e) => {
                                setDefaultEpicColor(`bg-[${e.target.value}] border-[${e.target.value}]`);
                                setShowColorPicker(null);
                              }}
                              className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                              title="Choose custom color"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Valores y colores para otras opciones */}
              {colorBy && colorBy !== 'default' && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-xs font-medium text-gray-700 mb-3">
                    {colorBy === 'device' ? 'Devices & Platform' : colorBy.charAt(0).toUpperCase() + colorBy.slice(1)} Colors
                  </h4>
                  <div className="space-y-2">
                    {getUniqueValues(colorBy).map(value => {
                      const currentColor = (() => {
                        switch (colorBy) {
                          case 'status': return getStatusColor(value);
                          case 'assignee': return getAssigneeColor(value);
                          case 'initiative': return getInitiativeColor([{ value }]);
                          case 'featureType': return getFeatureTypeColor({ value });
                          case 'device': return getDeviceColor([{ value }]); // Pasar estructura correcta
                          default: return 'bg-white border-gray-300';
                        }
                      })();

                      return (
                        <div key={value} className="flex items-center justify-between">
                          <span className="text-xs text-gray-700 truncate flex-1 mr-2">
                            {value}
                          </span>
                          <div className="flex items-center gap-2">
                            {/* Cuadrado de color actual */}
                            <button
                              onClick={() => setShowColorPicker(showColorPicker === `${colorBy}-${value}` ? null : `${colorBy}-${value}`)}
                              className={`w-6 h-6 rounded-full border-2 ${currentColor} cursor-pointer hover:opacity-80 transition-opacity`}
                              title={`Change color for ${value} (current: ${currentColor})`}
                            />
                            
                            {/* Selector de color circular */}
                            {showColorPicker === `${colorBy}-${value}` && (
                              <ColorPicker option={colorBy} value={value} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Aquí irán más opciones de apariencia en el futuro */}
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1">
          <div 
            ref={canvasRef}
            className="relative bg-gray-100 border border-gray-300 rounded-lg overflow-hidden"
            style={{ 
              height: `${canvasHeight}px`,
              width: `${canvasWidth}px`
            }}
          >
        {/* Cabeceras de releases */}
        {(() => {
          const epicsByRelease = new Map<string, Epic[]>();
          epics.forEach(epic => {
            const versions = epic.fields.fixVersions || [];
            if (versions.length > 0) {
              versions.forEach(version => {
                const versionName = version.name;
                if (!epicsByRelease.has(versionName)) {
                  epicsByRelease.set(versionName, []);
                }
                epicsByRelease.get(versionName)!.push(epic);
              });
            } else {
              if (!epicsByRelease.has('Sin Release')) {
                epicsByRelease.set('Sin Release', []);
              }
              epicsByRelease.get('Sin Release')!.push(epic);
            }
          });
          
          const sortedReleases = Array.from(epicsByRelease.keys()).sort();
          const columnWidth = 220; // Ancho fijo
          const columnSpacing = 12; // Espaciado horizontal entre releases
          
          return sortedReleases.map((releaseName, releaseIndex) => (
            <div
              key={releaseName}
              className="absolute bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded"
              style={{
                left: `${20 + (releaseIndex * (columnWidth + columnSpacing))}px`, // Usar columnSpacing
                top: '20px', // Alineado con el inicio de las epics
                width: `${columnWidth}px`, // Mismo ancho que las epics
                textAlign: 'center'
              }}
            >
              {releaseName}
            </div>
          ));
        })()}
        
        {blocks.map(block => (
          <div
            key={block.id}
            data-epic-id={block.id}
            className={`epic-block absolute border rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
              removedEpics.has(block.id) 
                ? 'bg-gray-300 border-gray-400 opacity-60 epic-removed' 
                : getEpicColor(block.epic)
            }`}
            style={{
              left: `${block.x}px`,
              top: `${block.y}px`,
              width: `${block.width}px`,
              height: `${calculateCardHeight()}px` // Usar altura dinámica
            }}
            onClick={() => setSelectedEpic(selectedEpic === block.id ? null : block.id)}
          >
            {/* Popup de opciones */}
            {selectedEpic === block.id && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-400 rounded-lg shadow-lg z-50 min-w-[150px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleEpicRemoval(block.id);
                    setSelectedEpic(null);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-800"
                >
                  <span className="text-red-500">×</span>
                  {removedEpics.has(block.id) ? 'Restaurar' : 'Eliminar'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveEpicUp(block.id);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-800"
                >
                  <span>↑</span>
                  Subir
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveEpicDown(block.id);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-800"
                >
                  <span>↓</span>
                  Bajar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEpicInJira(block.epic.key);
                    setSelectedEpic(null);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-800"
                >
                  <span>🔗</span>
                  Abrir en Jira
                </button>
              </div>
            )}
            
            {/* Contenido reaprovechado con layout vertical */}
            <div className="flex flex-col h-full overflow-hidden">
              {fieldOrder.map((field) => {
                if (!cardFields[field as keyof typeof cardFields]) return null;
                
                switch (field) {
                  case 'title':
                    return (
                      <h3 key={`${block.id}-title`} className="text-xs font-semibold text-gray-900 mb-1 line-clamp-2 flex-shrink-0">
                        {block.epic.fields.summary}
                      </h3>
                    );
                  case 'shortDescription':
                    return block.epic.fields.customfield_29702 ? (
                      <p key={`${block.id}-shortDescription`} className="text-[11px] text-gray-600 mb-1 line-clamp-2 flex-shrink-0">
                        {block.epic.fields.customfield_29702}
                      </p>
                    ) : null;
                  case 'image':
                    return block.epic.fields.customfield_29704 ? (
                      <div key={`${block.id}-image`} className="flex-1 min-h-[40px] flex items-center justify-center mb-1">
                        <img 
                          src={`/api/jira/image-proxy?url=${encodeURIComponent(block.epic.fields.customfield_29704)}`} 
                          alt="Imagen" 
                          className="max-h-[40px] max-w-full object-contain"
                        />
                      </div>
                    ) : null;
                  case 'labels':
                    return block.epic.fields.labels && block.epic.fields.labels.length > 0 ? (
                      <div key={`${block.id}-labels`} className="flex flex-wrap gap-1 mb-1">
                        {block.epic.fields.labels.slice(0, 2).map((label, index) => (
                          <span 
                            key={`${block.id}-label-${index}`}
                            className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-[10px] rounded"
                          >
                            {label}
                          </span>
                        ))}
                        {block.epic.fields.labels.length > 2 && (
                          <span key={`${block.id}-more-labels`} className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-[10px] rounded">
                            +{block.epic.fields.labels.length - 2}
                          </span>
                        )}
                      </div>
                    ) : null;
                  case 'obReach':
                    return (
                      <div key={`${block.id}-obReach`} className="mb-1">
                        {getObReachDisplay(block.epic.fields.customfield_29712)}
                      </div>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          </div>
        ))}
        
        {/* Leyenda de colores dentro del canvas */}
        {getColorLegend() && (
          <div 
            data-legend
            className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-300 p-3"
          >
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Legend ({colorBy === 'status' ? 'Status' : colorBy === 'assignee' ? 'Assignee' : colorBy === 'featureType' ? 'Feature Type' : 'Devices & Platform'})
            </h4>
            <div className="flex flex-wrap gap-2">
              {getColorLegend()?.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <div 
                    className={`w-4 h-4 rounded border ${item.color}`}
                  />
                  <span className="text-gray-700">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Línea separadora y área de eliminadas */}
        {removedEpics.size > 0 && (
          <div className="removed-section absolute bottom-0 left-0 right-0 bg-gray-200 border-t-2 border-gray-400">
            <div className="p-2 text-xs font-semibold text-gray-600">
              Epics eliminadas (no se exportarán)
            </div>
          </div>
        )}
        </div>
        </div>
      </div>

      {/* Modal para personalizar cards */}
      {showCustomizeCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Customize Card</h2>
                <button
                  onClick={() => setShowCustomizeCard(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

            {/* Contenido del modal con layout horizontal */}
            <div className="flex gap-6">
              {/* Lista de campos disponibles - izquierda */}
              <div className="w-72 space-y-1 ml-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Available Fields</h3>
                <div className="space-y-1">
                  <label className="flex items-center p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cardFields.title}
                      onChange={(e) => {
                        if (e.target.checked) {
                          activateField('title');
                        } else {
                          deactivateField('title');
                        }
                      }}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-900">Title</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cardFields.shortDescription}
                      onChange={(e) => {
                        if (e.target.checked) {
                          activateField('shortDescription');
                        } else {
                          deactivateField('shortDescription');
                        }
                      }}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-900">Short Description</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cardFields.image}
                      onChange={(e) => {
                        if (e.target.checked) {
                          activateField('image');
                        } else {
                          deactivateField('image');
                        }
                      }}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-900">Image</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cardFields.labels}
                      onChange={(e) => {
                        if (e.target.checked) {
                          activateField('labels');
                        } else {
                          deactivateField('labels');
                        }
                      }}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-900">Labels</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cardFields.obReach}
                      onChange={(e) => {
                        if (e.target.checked) {
                          activateField('obReach');
                        } else {
                          deactivateField('obReach');
                        }
                      }}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-900">OB Reach</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview del card - derecha */}
              <div className="flex-1 mr-6">
                <div className="bg-white border border-gray-300 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Card Preview</h3>
                  <div 
                    className="relative bg-gray-50 border border-gray-200 rounded p-3"
                    style={{
                      width: '220px',
                      height: `${cardPreviewHeight}px`,
                      minHeight: '60px'
                    }}
                  >
                    {fieldOrder.map((field) => {
                      if (!cardFields[field as keyof typeof cardFields]) return null;
                      
                      const fieldConfig = {
                        title: {
                          component: (
                            <h3 className="text-xs font-semibold text-gray-900 mb-1 line-clamp-2">
                              Sample Epic Title
                            </h3>
                          ),
                          label: 'Title'
                        },
                        shortDescription: {
                          component: (
                            <p className="text-[11px] text-gray-600 mb-1 line-clamp-2">
                              Sample short description text
                            </p>
                          ),
                          label: 'Short Description'
                        },
                        image: {
                          component: (
                            <div className="flex-1 min-h-[40px] flex items-center justify-center mb-1">
                              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                IMG
                              </div>
                            </div>
                          ),
                          label: 'Image'
                        },
                        labels: {
                          component: (
                            <div className="flex flex-wrap gap-1 mb-1">
                              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-[10px] rounded">Label 1</span>
                              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-[10px] rounded">Label 2</span>
                            </div>
                          ),
                          label: 'Labels'
                        },
                        obReach: {
                          component: (
                            <div className="flex items-start mb-1">
                              <img 
                                src="/images/ob-reach/spain-logo.svg" 
                                alt="SPAIN logo"
                                className="w-6 h-6 object-contain"
                              />
                            </div>
                          ),
                          label: 'OB Reach'
                        }
                      };
                      
                      return (
                        <div
                          key={field}
                          draggable
                          onDragStart={() => handleDragStart(field)}
                          onDragOver={(e) => handleDragOver(e, field)}
                          onDragLeave={() => setDragOverField(null)}
                          onDrop={(e) => handleDrop(e, field)}
                          className={`cursor-move ${
                            draggedField === field ? 'opacity-50' : ''
                          } ${
                            dragOverField === field ? 'border-2 border-blue-400 rounded' : ''
                          }`}
                        >
                          {fieldConfig[field as keyof typeof fieldConfig].component}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-center gap-2 mb-6">
              <button
                onClick={() => setShowCustomizeCard(false)}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCustomizeCard(false)}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Apply Changes
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Modal FilterManager */}
      {showFilterManager && (
        <FilterManager
          key={enabledFiltersString}
          availableFilters={availableFilters}
          enabledFilters={enabledFilters}
          onToggleFilter={toggleFilter}
          onClose={() => setShowFilterManager(false)}
        />
      )}
    </div>
  );
}

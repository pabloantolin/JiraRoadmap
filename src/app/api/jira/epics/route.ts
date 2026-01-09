import { NextRequest, NextResponse } from 'next/server';

// Fetch Jira epics from the Jira API
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const themes = searchParams.get('themes');
  
  console.log('URL:', req.url);
  console.log('Assignees parameter:', searchParams.get('assignees'));
  
  const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
  const JIRA_USER = process.env.JIRA_USER;
  const JIRA_PASSWORD = process.env.JIRA_PASSWORD;
  const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;
  
  if (!JIRA_BASE_URL || !JIRA_USER || !JIRA_PASSWORD || !JIRA_PROJECT_KEY) {
    return NextResponse.json({ error: 'Missing Jira credentials or project key' }, { status: 500 });
  }

  const auth = Buffer.from(`${JIRA_USER}:${JIRA_PASSWORD}`).toString('base64');
  const fixVersions = searchParams.get('fixVersions');
  const initiatives = searchParams.get('initiatives');
  const devices = searchParams.get('devices');
  const featureTypes = searchParams.get('featureTypes');
  const obReaches = searchParams.get('obReaches');
  const sponsors = searchParams.get('sponsors');
  const statuses = searchParams.get('statuses');
  const assignees = searchParams.get('assignees');
  const labels = searchParams.get('labels');
  
  let jql = `project=${JIRA_PROJECT_KEY} AND issuetype=Epic`;

  // Añadir filtros al JQL
  if (fixVersions) {
    const versionList = fixVersions.split(',').map(v => v.trim());
    const hasEmpty = versionList.includes('(Empty)');
    const hasNotEmpty = versionList.includes('(Not empty)');
    const regularVersions = versionList.filter(v => v !== '(Empty)' && v !== '(Not empty)');
    
    // Manejar opciones especiales para fixVersion
    if (hasEmpty && hasNotEmpty) {
      // No se pueden seleccionar ambos, no aplicar filtro
      console.log('FixVersion: Empty y Not empty seleccionados, no se aplica filtro');
    } else if (hasEmpty) {
      jql += ` AND fixVersion is EMPTY`;
    } else if (hasNotEmpty) {
      jql += ` AND fixVersion is not EMPTY`;
    } else if (regularVersions.length > 0) {
      const versionString = regularVersions.map(v => `"${v}"`).join(',');
      jql += ` AND fixVersion in (${versionString})`;
    }
  }

  if (themes) {
    // No filtrar en JQL, lo haremos por relaciones después
    console.log('Themes parameter:', themes);
  }

  if (devices) {
    // No filtrar en JQL, lo haremos por campo después
    console.log('Devices parameter:', devices);
  }

  if (initiatives) {
    // No filtrar en JQL, lo haremos por relaciones después
    console.log('Initiatives parameter:', initiatives);
  }

  console.log('JQL Query:', jql);

  const searchUrl = `${JIRA_BASE_URL}/rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=summary,status,startDate,dueDate,fixVersions,customfield_21800,customfield_21801,customfield_29704,customfield_29701,customfield_29702,customfield_29713,customfield_10011,customfield_29712,customfield_29800,assignee,labels&maxResults=50`;

  // Obtener todas las versiones del proyecto para el selector
  const versionsUrl = `${JIRA_BASE_URL}/rest/api/2/project/${JIRA_PROJECT_KEY}/versions`;

  // Obtener todas las initiatives para el selector
  const initiativesUrl = `${JIRA_BASE_URL}/rest/api/2/search?jql=project=${JIRA_PROJECT_KEY} AND issuetype=Initiative&fields=summary,key`;

  // Obtener todos los themes para el selector
  const themesUrl = `${JIRA_BASE_URL}/rest/api/2/search?jql=project=${JIRA_PROJECT_KEY} AND issuetype=Theme&fields=summary,key`;

  // Función para obtener opciones de un campo personalizado
  const getFieldOptions = async (fieldId: string) => {
    try {
      // Intentar diferentes endpoints para obtener las opciones
      const endpoints = [
        `${JIRA_BASE_URL}/rest/api/2/field/${fieldId}/options`,
        `${JIRA_BASE_URL}/rest/api/2/customFieldOption/${fieldId}`,
        `${JIRA_BASE_URL}/rest/api/2/field/${fieldId}/context/options`
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Accept': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Opciones obtenidas para ${fieldId} desde ${endpoint}:`, data);
            
            // Extraer opciones de diferentes estructuras posibles
            let options = [];
            if (data.options && Array.isArray(data.options)) {
              options = data.options;
            } else if (data.values && Array.isArray(data.values)) {
              options = data.values;
            } else if (Array.isArray(data)) {
              options = data;
            }
            
            return options.map((option: any) => ({
              id: `${fieldId}-${option.id || Math.random()}`,
              value: option.value || option.name || option.toString(),
              name: option.value || option.name || option.toString()
            }));
          }
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} falló para ${fieldId}:`, endpointError);
          continue; // Intentar el siguiente endpoint
        }
      }
    } catch (error) {
      console.log(`Error obteniendo opciones para ${fieldId}:`, error);
    }
    return [];
  };

  // Función para obtener valores de campo buscando en epics
  const getFieldValuesFromEpics = async (fieldId: string, fieldName: string) => {
    try {
      const searchUrl = `${JIRA_BASE_URL}/rest/api/2/search?jql=project=${JIRA_PROJECT_KEY} AND issuetype=Epic&fields=${fieldId}&maxResults=100`;
      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const values = new Set<string>();
        
        data.issues?.forEach((issue: any) => {
          const fieldValue = issue.fields?.[fieldId];
          
          // Manejo especial para assignee
          if (fieldId === 'assignee' && fieldValue) {
            const displayName = fieldValue.displayName;
            if (displayName) values.add(displayName);
          }
          // Manejo para otros campos
          else if (fieldValue) {
            if (Array.isArray(fieldValue)) {
              fieldValue.forEach((item: any) => {
                const value = item.value || item.name || item.toString();
                if (value) values.add(value);
              });
            } else if (typeof fieldValue === 'object') {
              const value = fieldValue.value || fieldValue.name || fieldValue.toString();
              if (value) values.add(value);
            } else if (typeof fieldValue === 'string') {
              values.add(fieldValue);
            }
          }
        });
        
        console.log(`Valores encontrados para ${fieldName} (${fieldId}):`, Array.from(values));
        
        return Array.from(values).map((value, index) => ({
          id: `${fieldId}-${index}`,
          value: value,
          name: value
        }));
      }
    } catch (error) {
      console.log(`Error obteniendo valores de epics para ${fieldId}:`, error);
    }
    return [];
  };

  // Obtener todos los valores de Devices & Platform para el selector
  const devicesUrl = `${JIRA_BASE_URL}/rest/api/2/search?jql=project=${JIRA_PROJECT_KEY} AND issuetype=Epic&fields=customfield_29713&maxResults=100`;

  // Si hay initiatives seleccionadas, obtener sus relaciones
  let initiativeRelations: any[] = [];
  if (initiatives) {
    const initiativeKeys = initiatives.split(',').map(i => i.trim());
    for (const key of initiativeKeys) {
      const issueUrl = `${JIRA_BASE_URL}/rest/api/2/issue/${key}?fields=summary,issuelinks`;
      try {
        const issueResp = await fetch(issueUrl, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
          },
        });
        if (issueResp.ok) {
          const issueData = await issueResp.json();
          console.log(`Relaciones de ${key}:`, issueData.fields.issuelinks);
          initiativeRelations.push({
            initiative: key,
            summary: issueData.fields.summary,
            relations: issueData.fields.issuelinks || []
          });
        }
      } catch (e) {
        console.log(`Error obteniendo relaciones de ${key}:`, e);
      }
    }
  }

  // Si hay themes seleccionados, obtener sus initiatives hijas
  let themeInitiatives: any[] = [];
  if (themes) {
    const themeKeys = themes.split(',').map(t => t.trim());
    for (const themeKey of themeKeys) {
      const issueUrl = `${JIRA_BASE_URL}/rest/api/2/issue/${themeKey}?fields=summary,issuelinks`;
      try {
        const issueResp = await fetch(issueUrl, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
          },
        });
        if (issueResp.ok) {
          const issueData = await issueResp.json();
          console.log(`Relaciones de theme ${themeKey}:`, issueData.fields.issuelinks);
          
          // Extraer initiatives que son "is child of" del theme
          const childInitiatives = (issueData.fields.issuelinks || [])
            .filter((link: any) => 
              link.type?.name === 'Hierarchy' && 
              link.inwardIssue?.fields?.issuetype?.name === 'Initiative'
            )
            .map((link: any) => ({
              key: link.inwardIssue?.key || '',
              summary: link.inwardIssue?.fields?.summary || 'Sin nombre',
              id: link.inwardIssue?.id || ''
            }))
            .filter((init: any) => init.key && init.id); // Filtrar valores válidos
          
          themeInitiatives.push(...childInitiatives);
        }
      } catch (e) {
        console.log(`Error obteniendo relaciones de theme ${themeKey}:`, e);
      }
    }
  }

  try {
    let allEpics: any[] = [];
    let startAt = 0;
    let total = 0;
    const maxResults = 50;

    // Paginación para obtener todas las epics
    do {
      const paginatedUrl = `${JIRA_BASE_URL}/rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=summary,status,startDate,dueDate,fixVersions,customfield_21800,customfield_21801,customfield_29704,customfield_29701,customfield_29702,customfield_29713,customfield_10011,customfield_29712,customfield_29800,assignee,labels&maxResults=${maxResults}&startAt=${startAt}`;
      
      const response = await fetch(paginatedUrl, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.log('Jira Error Response:', error);
        return NextResponse.json({ error }, { status: response.status });
      }
      
      const data = await response.json();
      allEpics = allEpics.concat(data.issues || []);
      total = data.total || 0;
      startAt += maxResults;
    } while (startAt < total);

    console.log('Total epics recuperadas:', allEpics.length);
    
    // Filtrar epics basándose en las relaciones de initiatives y themes
    let filteredEpics = allEpics;
    
    // Filtrar por initiatives seleccionadas
    if (initiatives && initiativeRelations.length > 0) {
      const initiativeKeys = initiatives.split(',').map(i => i.trim());
      const epicKeysFromRelations = new Set<string>();
      
      initiativeRelations.forEach(rel => {
        if (initiativeKeys.includes(rel.initiative)) {
          rel.relations.forEach((relation: any) => {
            if (relation.inwardIssue) {
              epicKeysFromRelations.add(relation.inwardIssue.key);
            }
          });
        }
      });
      
      filteredEpics = filteredEpics.filter((epic: any) => 
        epicKeysFromRelations.has(epic.key)
      );
      
      console.log('Epics después de filtrar por initiatives:', filteredEpics.length);
      console.log('Keys de epics filtradas:', filteredEpics.map((e: any) => e.key));
    }
    
    // Filtrar por themes (a través de sus initiatives hijas)
    console.log('Checking themes filter. themes parameter:', themes);
    console.log('themeInitiatives length:', themeInitiatives.length);
    
    if (themes && themeInitiatives.length > 0) {
      console.log('Theme initiatives encontradas:', themeInitiatives);
      
      // Obtener relaciones de las initiatives hijas de los themes
      const themeInitiativeKeys = themeInitiatives.map(init => init.key);
      
      let themeInitiativeRelations: any[] = [];
      
      for (const initiativeKey of themeInitiativeKeys) {
        const issueUrl = `${JIRA_BASE_URL}/rest/api/2/issue/${initiativeKey}?fields=summary,issuelinks`;
        try {
          const issueResp = await fetch(issueUrl, {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Accept': 'application/json',
            },
          });
          if (issueResp.ok) {
            const issueData = await issueResp.json();
            themeInitiativeRelations.push({
              initiative: initiativeKey,
              relations: issueData.fields.issuelinks || []
            });
          }
        } catch (e) {
          console.log(`Error obteniendo relaciones de initiative ${initiativeKey}:`, e);
        }
      }
      
      const epicKeysFromThemeRelations = new Set<string>();
      themeInitiativeRelations.forEach(rel => {
        rel.relations.forEach((relation: any) => {
          if (relation.inwardIssue && relation.type?.name === 'Hierarchy') {
            epicKeysFromThemeRelations.add(relation.inwardIssue.key);
          }
        });
      });
      
      const currentEpicKeys = new Set(filteredEpics.map((e: any) => e.key));
      const intersection = new Set([...currentEpicKeys].filter(key => epicKeysFromThemeRelations.has(key)));
      filteredEpics = filteredEpics.filter((epic: any) => intersection.has(epic.key));
    }
    
    // Filtrar por devices & platform
    if (devices) {
      const deviceList = devices.split(',').map(d => d.trim());
      const hasEmpty = deviceList.includes('(Empty)');
      const hasNotEmpty = deviceList.includes('(Not empty)');
      const regularDevices = deviceList.filter(d => d !== '(Empty)' && d !== '(Not empty)');
      
      filteredEpics = filteredEpics.filter((epic: any) => {
        const device = epic.fields?.customfield_29713;
        let deviceNames = [];
        
        if (device) {
          if (Array.isArray(device)) {
            device.forEach((deviceOption: any) => {
              if (deviceOption.value && typeof deviceOption.value === 'string') {
                deviceNames.push(deviceOption.value);
              }
            });
          } else if (typeof device === 'object' && device.value) {
            deviceNames.push(device.value);
          } else if (typeof device === 'string') {
            deviceNames.push(device);
          }
        }
        
        if (hasEmpty && hasNotEmpty) {
          return false;
        }
        
        if (hasEmpty) {
          return deviceNames.length === 0;
        }
        
        if (hasNotEmpty) {
          return deviceNames.length > 0;
        }
        
        return deviceNames.some(deviceName => regularDevices.includes(deviceName));
      });
    }
    
    // Filtrar por Feature Type
    if (featureTypes) {
      const featureTypeList = featureTypes.split(',').map(f => f.trim());
      const hasEmpty = featureTypeList.includes('(Empty)');
      const hasNotEmpty = featureTypeList.includes('(Not empty)');
      const regularFeatureTypes = featureTypeList.filter(f => f !== '(Empty)' && f !== '(Not empty)');
      
      filteredEpics = filteredEpics.filter((epic: any) => {
        const featureType = epic.fields?.customfield_29701;
        let featureTypeNames = [];
        
        if (featureType) {
          if (Array.isArray(featureType)) {
            featureType.forEach((featureTypeOption: any) => {
              if (featureTypeOption.value && typeof featureTypeOption.value === 'string') {
                featureTypeNames.push(featureTypeOption.value);
              }
            });
          } else if (typeof featureType === 'object' && featureType.value) {
            featureTypeNames.push(featureType.value);
          } else if (typeof featureType === 'string') {
            featureTypeNames.push(featureType);
          }
        }
        
        if (hasEmpty && hasNotEmpty) {
          return false;
        }
        
        if (hasEmpty) {
          return featureTypeNames.length === 0;
        }
        
        if (hasNotEmpty) {
          return featureTypeNames.length > 0;
        }
        
        return featureTypeNames.some(featureTypeName => regularFeatureTypes.includes(featureTypeName));
      });
    }
    
    // Filtrar por OB Reach
    if (obReaches) {
      const obReachList = obReaches.split(',').map(o => o.trim());
      const hasEmpty = obReachList.includes('(Empty)');
      const hasNotEmpty = obReachList.includes('(Not empty)');
      const regularObReaches = obReachList.filter(o => o !== '(Empty)' && o !== '(Not empty)');
      
      filteredEpics = filteredEpics.filter((epic: any) => {
        const obReach = epic.fields?.customfield_29712;
        let obReachNames = [];
        
        if (obReach) {
          if (Array.isArray(obReach)) {
            obReach.forEach((obReachOption: any) => {
              if (obReachOption.value && typeof obReachOption.value === 'string') {
                obReachNames.push(obReachOption.value);
              }
            });
          } else if (typeof obReach === 'object' && obReach.value) {
            obReachNames.push(obReach.value);
          } else if (typeof obReach === 'string') {
            obReachNames.push(obReach);
          }
        }
        
        if (hasEmpty && hasNotEmpty) {
          return false;
        }
        
        if (hasEmpty) {
          return obReachNames.length === 0;
        }
        
        if (hasNotEmpty) {
          return obReachNames.length > 0;
        }
        
        return obReachNames.some(obReachName => regularObReaches.includes(obReachName));
      });
    }
    
    // Filtrar por Sponsor
    if (sponsors) {
      const sponsorList = sponsors.split(',').map(s => s.trim());
      const hasEmpty = sponsorList.includes('(Empty)');
      const hasNotEmpty = sponsorList.includes('(Not empty)');
      const regularSponsors = sponsorList.filter(s => s !== '(Empty)' && s !== '(Not empty)');
      
      filteredEpics = filteredEpics.filter((epic: any) => {
        const sponsor = epic.fields?.customfield_29800;
        let sponsorNames = [];
        
        if (sponsor) {
          if (Array.isArray(sponsor)) {
            sponsor.forEach((sponsorOption: any) => {
              if (sponsorOption.value && typeof sponsorOption.value === 'string') {
                sponsorNames.push(sponsorOption.value);
              }
            });
          } else if (typeof sponsor === 'object' && sponsor.value) {
            sponsorNames.push(sponsor.value);
          } else if (typeof sponsor === 'string') {
            sponsorNames.push(sponsor);
          }
        }
        
        if (hasEmpty && hasNotEmpty) {
          return false;
        }
        
        if (hasEmpty) {
          return sponsorNames.length === 0;
        }
        
        if (hasNotEmpty) {
          return sponsorNames.length > 0;
        }
        
        return sponsorNames.some(sponsorName => regularSponsors.includes(sponsorName));
      });
    }
    
    // Filtrar por Status
    if (statuses) {
      const statusList = statuses.split(',').map(s => s.trim());
      
      filteredEpics = filteredEpics.filter((epic: any) => {
        const status = epic.fields?.status?.name;
        return status && statusList.includes(status);
      });
    }
    
    // Filtrar por Assignee
    if (assignees) {
      const assigneeList = assignees.split(',').map(a => a.trim());
      
      // Manejar opciones especiales
      const hasEmpty = assigneeList.includes('(Empty)');
      const hasNotEmpty = assigneeList.includes('(Not empty)');
      const regularAssignees = assigneeList.filter(a => a !== '(Empty)' && a !== '(Not empty)');
      
      filteredEpics = filteredEpics.filter((epic: any) => {
        const assignee = epic.fields?.assignee;
        const assigneeDisplayName = assignee?.displayName;
        
        // Lógica para Empty/Not empty
        if (hasEmpty && hasNotEmpty) {
          return false;
        }
        
        if (hasEmpty) {
          return !assigneeDisplayName;
        }
        
        if (hasNotEmpty) {
          return !!assigneeDisplayName;
        }
        
        return assigneeDisplayName && regularAssignees.includes(assigneeDisplayName);
      });
      
      console.log('Epics después de filtrar por assignees:', filteredEpics.length);
    }

    // Filtrar por Labels
    if (labels) {
      const labelList = labels.split(',').map(l => l.trim());
      const hasEmpty = labelList.includes('(Empty)');
      const hasNotEmpty = labelList.includes('(Not empty)');
      const regularLabels = labelList.filter(l => l !== '(Empty)' && l !== '(Not empty)');
      
      filteredEpics = filteredEpics.filter((epic: any) => {
        const epicLabels = epic.fields?.labels || [];
        
        // Lógica para Empty/Not empty
        if (hasEmpty && hasNotEmpty) {
          return false;
        }
        
        if (hasEmpty) {
          return epicLabels.length === 0;
        }
        
        if (hasNotEmpty) {
          return epicLabels.length > 0;
        }
        
        // Si se seleccionan múltiples labels, la epic debe tener AL MENOS UNO de los labels seleccionados
        return epicLabels.some((label: string) => regularLabels.includes(label));
      });
      
      console.log('Epics después de filtrar por labels:', filteredEpics.length);
    }

    // Siempre devolver todos los datos de los selectores, independientemente de los filtros
    // Obtener todas las versiones del proyecto para el selector
    const versionsResp = await fetch(versionsUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });
    let fixVersionsAll = [];
    if (versionsResp.ok) {
      fixVersionsAll = await versionsResp.json();
    }

    // Obtener todas las initiatives para el selector
    const initiativesResp = await fetch(initiativesUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });
    let initiativesAll = [];
    if (initiativesResp.ok) {
      const initiativesData = await initiativesResp.json();
      console.log('Raw initiatives data:', initiativesData);
      initiativesAll = initiativesData.issues || [];
    }
    console.log('Total initiatives encontradas:', initiativesAll.length);
    console.log('Initiatives keys:', initiativesAll.map((i: any) => i.key));

    // Obtener themes (siempre)
    const themesResp = await fetch(themesUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });
    let themesAll = [];
    if (themesResp.ok) {
      const themesData = await themesResp.json();
      console.log('Raw themes data:', themesData);
      themesAll = (themesData.issues || []).map((theme: any) => ({
        id: theme.id,
        key: theme.key,
        summary: theme.fields.summary
      }));
      console.log('Processed themes:', themesAll);
    }

    // Obtener devices & platforms (siempre)
    const devicesResp = await fetch(devicesUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });
    let devicesAll: {id: string, value: string, name: string}[] = [];
    if (devicesResp.ok) {
      const devicesData = await devicesResp.json();
      
      // Extraer valores únicos de customfield_29713
      const deviceValues = new Set<string>();
      devicesData.issues?.forEach((issue: any) => {
        const device = issue.fields?.customfield_29713;
        if (device) {
          // device es un array de objetos, no un objeto simple
          if (Array.isArray(device)) {
            device.forEach((deviceOption: any) => {
              if (deviceOption.value && typeof deviceOption.value === 'string') {
                deviceValues.add(deviceOption.value);
              }
            });
          } else if (typeof device === 'object' && device.value) {
            deviceValues.add(device.value);
          } else if (typeof device === 'string') {
            deviceValues.add(device);
          }
        }
      });
      devicesAll = Array.from(deviceValues).map((value, index) => ({ 
        id: `device-${index}`,
        value: value, 
        name: value 
      }));
      // console.log('Devices encontrados:', devicesAll.length, 'dispositivos');
    }

    // Recolectar valores únicos para Feature Type (customfield_29701)
    let featureTypesAll = await getFieldOptions('customfield_29701');
    if (featureTypesAll.length === 0) {
      console.log('No se obtuvieron opciones predefinidas para Feature Type, buscando en epics...');
      featureTypesAll = await getFieldValuesFromEpics('customfield_29701', 'Feature Type');
    }
    console.log('Feature Type final:', featureTypesAll);

    // Recolectar valores únicos para OB Reach (customfield_29712)
    let obReachesAll = await getFieldOptions('customfield_29712');
    if (obReachesAll.length === 0) {
      console.log('No se obtuvieron opciones predefinidas para OB Reach, buscando en epics...');
      obReachesAll = await getFieldValuesFromEpics('customfield_29712', 'OB Reach');
    }
    console.log('OB Reach final:', obReachesAll);

    // Recolectar valores únicos para Sponsor (customfield_29800)
    let sponsorsAll = await getFieldOptions('customfield_29800');
    if (sponsorsAll.length === 0) {
      console.log('No se obtuvieron opciones predefinidas para Sponsor, buscando en epics...');
      sponsorsAll = await getFieldValuesFromEpics('customfield_29800', 'Sponsor');
    }
    console.log('Sponsor final:', sponsorsAll);

    // Recolectar valores únicos para Assignee
    let assigneesAll = await getFieldValuesFromEpics('assignee', 'Assignee');
    console.log('Assignee final:', assigneesAll);

    // Recolectar valores únicos para Labels
    let labelsAll: {id: string, value: string, name: string}[] = [];
    const labelValues = new Set<string>();
    allEpics.forEach((epic: any) => {
      const labels = epic.fields?.labels || [];
      labels.forEach((label: string) => {
        if (label) {
          labelValues.add(label);
        }
      });
    });
    labelsAll = Array.from(labelValues).map((value, index) => ({ 
      id: `label-${index}`,
      value: value, 
      name: value 
    }));
    console.log('Labels final:', labelsAll);

    // Recolectar valores únicos para Status
    let statusesAll: {id: string, value: string, name: string}[] = [];
    const statusValues = new Set<string>();
    allEpics.forEach((epic: any) => {
      const status = epic.fields?.status?.name;
      if (status) {
        statusValues.add(status);
      }
    });
    statusesAll = Array.from(statusValues).map((value, index) => ({ 
      id: `status-${index}`,
      value: value, 
      name: value 
    }));

    return NextResponse.json({ 
      epics: filteredEpics, 
      fixVersionsAll, 
      initiativesAll, 
      themesAll, 
      devicesAll, 
      featureTypesAll, 
      obReachesAll, 
      sponsorsAll, 
      statusesAll,
      assigneesAll,
      initiativeRelations,
      themeInitiatives,
      labelsAll
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

import * as FileSystem from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import * as SQLite from 'expo-sqlite';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DB_NAME = 'mock_data.sqlite';

export const DEFAULT_AUTO_DELETE_DAYS = 30;

// load local DB to app local storage
export async function loadLocalDB(): Promise<string> {
  const [{ localUri }] = await Asset.loadAsync(
    require('../assets/mock_data.sqlite')
  );

  // path in app internal storage
  const internalDBPath = `${FileSystemLegacy.documentDirectory}${DB_NAME}`;

  // check if DB is already copied
  const info = await FileSystemLegacy.getInfoAsync(internalDBPath);
  // if not, copy from bundled assets
  if (!info.exists) {
    await FileSystemLegacy.copyAsync({ from: localUri!, to: internalDBPath });
    console.log('Copied bundled database to', internalDBPath);
  }
  return internalDBPath;
}

// open DB 
let db: SQLite.SQLiteDatabase | null = null;

export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  const path = await loadLocalDB();
  db = await SQLite.openDatabaseAsync(path);   
  return db;
}

// data types and queries
// HomeScreen Schema
export interface SiteSummary {
  id: number;
  namesite: string;
  county: string | null;
  inspectdate: string | null;
}

// SiteDetailScreen Schema
export interface InspectionDetail {
  id: number;
  namesite: string;
  _type: string | null;
  county: string | null;
  _naregion: string | null;
  inspectdate: string | null;
  naturalness_score: string | null; 
  naturalness_details: string | null;
  notes: string | null;
  iddetail: string | null;
  _subtype: string | null;
  area_ha: string | null;
  area_acre: string | null;
  _na_subregion_multi: string | null;
  recactivities_multi: string | null;
  sapaaweb: string | null;
  inatmap: string | null;
  inspectno: string | null;
  steward: string | null;
  steward_id?: number | null;
  steward_guest: string | null;
  steward_guest_id?: number | null;
  category: number | null;
  definition: string | null;
  inspection_id?: number; 
  detail_row_ids?: Map<string, number>; 
  notes_row_mapping?: Array<{ observationCode: string; rowId: number; value: string; field: 'obs_value' | 'obs_comm' }>;
}

// DownlaodedSite Schema
export interface DownloadedSite {
  id: number;
  namesite: string;
  county: string | null;
  inspectdate: string | null;
  lastAccessed: number; // timestamp for last download
}

// Site (MOCK SCHEMA)
export interface Site {
  id: number;
  name: string;
  location: string | null;
  last_inspection_date: string | null;
}

// Image
export interface Image {
  id: number;
  inspection_id: number;
  filename: string;
}

// PDF
export interface Pdf {
  id: number;
  site_id: number;
  filename: string;
  generated_date: string;
}

// INSPECTION
export interface Inspection {
  id: number;
  site_id: number;
  date: string;
  notes: string | null;
}

// get all sites (id, name, location, last_inspection_date)
export async function getSites(): Promise<Site[]> {
  const database = await openDatabase();
  const result = database.getAllSync<Site>(
    'SELECT id, name, location, last_inspection_date FROM sites ORDER BY name'
  );
  return result;
}

// get all images for site
export async function getImages(siteId: number): Promise<Image[]> {
  const database = await openDatabase();
  const result = database.getAllAsync<Image>(
    'SELECT id, inspection_id, filename FROM images WHERE inspection_id IN (SELECT id FROM inspections WHERE site_id = ?) ORDER BY id', [siteId]
  );
  return result;
}

// get all PDFs for site
export async function getPdfs(siteId: number): Promise<Pdf[]> {
  const database = await openDatabase();
  const result = database.getAllAsync<Pdf>(
    'SELECT id, site_id, filename, generated_date FROM pdfs WHERE site_id = ? ORDER BY id', [siteId]
  );
  return result;
}

// get all inspections for site
export async function getInspections(siteId: number): Promise<Inspection[]> {
  const database = await openDatabase();
  const result = database.getAllAsync<Inspection>(
    'SELECT id, site_id, date, notes FROM inspections WHERE site_id = ? ORDER BY id', [siteId]
  );
  return result;
}

function parseObservationId(observationCode: string): number | null {
  const match = observationCode.match(/^Q(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// get site list from supabase (online)
export const getSitesOnline = async (): Promise<SiteSummary[]> => {
  const { data, error } = await supabase
    .from('sites_list_fnr')
    .select('namesite, county, inspectdate')
    .order('namesite', { ascending: true });

  if (error) throw error;

  // add temp id
  return data.map((site, index) => ({
    id: index + 1, 
    namesite: site.namesite,
    county: site.county,
    inspectdate: site.inspectdate,
  }));
};

// get inspection details for a site from supabase (online)
export const getInspectionDetailsOnline = async (siteName: string): Promise<InspectionDetail[]> => {
  // First, get the inspection header IDs for this site (includes steward ID)
  const { data: headers, error: headerError } = await supabase
    .from('inspectheader')
    .select('id, inspectdate, inspectno, steward, "steward-guest"')
    .eq('q22-pasitename', siteName)
    .order('inspectdate', { ascending: false });

  if (headerError) throw headerError;

  // For each header, get the aggregated view data
  const inspections: InspectionDetail[] = [];
  
  for (const header of headers || []) {
    const { data: viewData, error: viewError } = await supabase
      .from('sites_report_fnr_test')
      .select('*')
      .eq('namesite', siteName)
      .eq('inspectdate', header.inspectdate)
      .single();

    if (viewError) {
      console.warn(`Error fetching view data for inspection ${header.id}:`, viewError);
      continue;
    }

    // Fetch all inspectdetails rows with their IDs for this inspection
    const { data: detailRows, error: detailError } = await supabase
      //.from('inspectdetails_fnr_test') // FOR TESTING
      .from('inspectdetails')
      .select('id, observation, obs_value, obs_comm')
      .eq('inspection', header.id)
      .order('id', { ascending: true });

    if (detailError) {
      console.warn(`Error fetching detail rows for inspection ${header.id}:`, detailError);
    }

    // Get observation codes from inspectquestions
    const { data: questions, error: questionsError } = await supabase
      .from('inspectquestions')
      .select('id, observation');

    if (questionsError) {
      console.warn('Error fetching questions:', questionsError);
    }

     // Create mapping from observation ID to code (e.g., 1 -> "Q31_Naturalness")
    const obsIdToCode = new Map<number, string>();
    if (questions) {
      questions.forEach(q => {
        obsIdToCode.set(q.id, q.observation);
      });
    }

    // Build detailed mapping: track which row ID produced each observation
    const notesRowMapping: Array<{ observationCode: string; rowId: number; value: string; field: 'obs_value' | 'obs_comm' }> = [];
    if (detailRows && obsIdToCode.size > 0) {
      detailRows.forEach(row => {
        const code = obsIdToCode.get(row.observation);
        if (code && code !== 'Q31_Naturalness' && code !== 'Q32_Natural_Comm') {
          const value = row.obs_value || row.obs_comm;
          const field = row.obs_value !== null ? 'obs_value' : 'obs_comm';  // <-- Define field here
          
          if (value) {
            notesRowMapping.push({
              observationCode: code,
              rowId: row.id,
              value: value, 
              field: field,
            });
          }
        }
      });
    }

    // Also keep the old detailRowIds map for naturalness fields
    const detailRowIds = new Map<string, number>();
    if (detailRows && obsIdToCode.size > 0) {
      detailRows.forEach(row => {
        const code = obsIdToCode.get(row.observation);
        if (code === 'Q31_Naturalness' || code === 'Q32_Natural_Comm') {
          detailRowIds.set(code, row.id);
        }
      });
    }

    inspections.push({
      id: inspections.length + 1, // Temp ID for UI
      inspection_id: header.id, // Real ID for updates
      namesite: viewData.namesite,
      iddetail: viewData.iddetail,
      _type: viewData._type,
      _subtype: viewData._subtype,
      area_ha: viewData['area-ha'],
      area_acre: viewData['area-acre'],
      _naregion: viewData._naregion,
      _na_subregion_multi: viewData._na_subregion_multi,
      recactivities_multi: viewData['recactivities-multi'],
      sapaaweb: viewData.sapaaweb,
      inatmap: viewData.inatmap,
      inspectno: viewData.inspectno,
      inspectdate: viewData.inspectdate,
      steward: viewData.steward, // This is the displayname from the view
      steward_id: header.steward, // This is the ID from inspectheader
      steward_guest: header['steward-guest'], // This is a string
      category: viewData.category,
      definition: viewData.definition,
      county: viewData.county,
      naturalness_score: viewData.naturalness_score,
      naturalness_details: viewData.naturalness_details,
      notes: viewData.notes,
      detail_row_ids: detailRowIds,
      notes_row_mapping: notesRowMapping,
    });
  }

  return inspections;
};

// update site inspection details 
export async function updateInspectionOnline(editedInspection: InspectionDetail) {
  const inspectionId = editedInspection.inspection_id;
  if (!inspectionId) throw new Error('Missing inspection_id - cannot update');

  try {
    // Update steward name
    if (editedInspection.steward_id && editedInspection.steward !== null) {
      const { error: stewardError } = await supabase
        //.from('luperson_fnr_test') // FOR TESTING
        .from('luperson')
        .update({
          displayname: editedInspection.steward,
        })
        .eq('id', editedInspection.steward_id);

      if (stewardError) {
        console.error('Error updating steward:', stewardError);
        throw stewardError;
      }

      console.log(`Updated steward displayname for ID ${editedInspection.steward_id} to "${editedInspection.steward}"`);
    }

    // Update steward guest 
    if (editedInspection.steward_guest !== null) {
      const { error: guestError } = await supabase
        //.from('inspectheader_fnr_test') // FOR TESTING
        .from('inspectheader')
        .update({ 'steward-guest': editedInspection.steward_guest })
        .eq('id', inspectionId);

      if (guestError) {
        console.error('Error updating steward guest:', guestError);
        throw guestError;
      }
      console.log(`Updated steward guest for inspection ${inspectionId} to "${editedInspection.steward_guest}"`);
    } 

    
    // Update naturalness_score
    if (editedInspection.naturalness_score !== null) {
      const { error: scoreError } = await supabase
        //.from('inspectdetails_fnr_test') // FOR TESTING
        .from('inspectdetails')
        .update({ obs_value: editedInspection.naturalness_score })
        .eq('inspection', inspectionId)
        .eq('observation', 1);  // ID 1 = Q1_Naturalness
      if (scoreError) throw scoreError;
      console.log(`Updated naturalness score for inspection ${inspectionId} to "${editedInspection.naturalness_score}"`);
    }

    //  Update naturalness_details
    if (editedInspection.naturalness_details !== null) {
      const { error: detailsError } = await supabase
        //.from('inspectdetails_fnr_test') // FOR TESTING
        .from('inspectdetails')
        .update({ obs_comm: editedInspection.naturalness_details })
        .eq('inspection', inspectionId)
        .eq('observation', 2);  // ID 2 = Q2_Natural_Comm
      if (detailsError) throw detailsError;
      console.log(`Updated naturalness details for inspection ${inspectionId}`);
    }

    // update observations/notes 
    if (editedInspection.notes !== null && editedInspection.notes !== undefined) {
      const notesMapping = editedInspection.notes_row_mapping;
      
      if (!notesMapping || notesMapping.length === 0) {
        console.warn('No notes_row_mapping available, cannot update observations');
      } else {
        // Split notes into individual observations
        const observations = editedInspection.notes
          .split('; ')
          .map(obs => obs.trim())
          .filter(obs => obs.length > 0);

        // Track which mapping entries we've used
        const usedMappingIndices = new Set<number>();

        for (let i = 0; i < observations.length; i++) {
          const obs = observations[i];
          
          // Only process "Qxx_" style entries
          const match = obs.match(/^(Q\d+[^:]*?):\s*(.*)$/);
          if (!match) continue;

          const observationCode = match[1];
          const newValue = match[2];

          // Skip naturalness observations (already handled above)
          if (observationCode === 'Q31_Naturalness' || observationCode === 'Q32_Natural_Comm') {
            continue;
          }

          // Find the NEXT unused matching entry with this observation code
          let mappingEntry = null;
          for (let j = 0; j < notesMapping.length; j++) {
            if (usedMappingIndices.has(j)) continue;
            
            if (notesMapping[j].observationCode === observationCode) {
              mappingEntry = notesMapping[j];
              usedMappingIndices.add(j);
              break;
            }
          }

          if (!mappingEntry) {
            console.warn(`No available row mapping found for observation "${observationCode}" at position ${i}`);
            continue;
          }

          const rowId = mappingEntry.rowId;
          const updateField = mappingEntry.field; // Use the stored field instead of guessing

          // Update using the unique row ID and correct field
          const { error: obsError } = await supabase
            //.from('inspectdetails_fnr_test') // FOR TESTING
            .from('inspectdetails')
            .update({ [updateField]: newValue })
            .eq('id', rowId);

          if (obsError) {
            console.error(`Error updating observation ${observationCode} (row ${rowId}):`, obsError);
            throw obsError;
          }

          console.log(`Updated observation ${observationCode} (row ${rowId}) in ${updateField} = "${newValue}"`);
        }
      }
    }


    console.log(`Successfully updated inspection ${inspectionId}`);
  } catch (error) {
    console.error('Error updating inspection:', error);
    throw error;
  }
}


// delete site report 
export async function deleteSiteReportOnline(inspectionId: number): Promise<void> {
  // delete from inspectdetails
  const { error: detailError } = await supabase
  //.from('inspectdetails_fnr_test') // FOR TESTING 
    .from('inspectdetails')
    .delete()
    .eq('inspection', inspectionId);
}

// download site bundle from supabase for offline use (online)
export const downloadSiteBundle = async (siteName: string): Promise<void> => {
  // create offline storage for site
  const siteDir = `${FileSystemLegacy.documentDirectory}sites/${siteName}/`;
  
  // ensure clean state
  const dirInfo = await FileSystemLegacy.getInfoAsync(siteDir);
  if (dirInfo.exists) {
    await FileSystemLegacy.deleteAsync(siteDir, { idempotent:true });
  }
  await FileSystemLegacy.makeDirectoryAsync(siteDir, {intermediates: true });
  
  // full db path
  const dbPath = `sites/${siteName}/data.sqlite`;
  
  // create local SQLite DB
  const database = await SQLite.openDatabaseAsync(dbPath);
  
  try {
    // create table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS inspections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        namesite TEXT,
        _type TEXT,
        county TEXT,
        _naregion TEXT,
        inspectdate TEXT,
        naturalness_score TEXT,
        naturalness_details TEXT,
        notes TEXT,
        iddetail TEXT,
        _subtype TEXT,
        area_ha TEXT,
        area_acre TEXT,
        _na_subregion_multi TEXT,
        recactivities_multi TEXT,
        sapaaweb TEXT,
        inatmap TEXT,
        inspectno TEXT,
        steward TEXT,
        steward_guest TEXT,
        category INTEGER,
        definition TEXT
      ); 
    `);

    // get data from supabase
    const { data, error } = await supabase
      .from('sites_report_fnr_test')
      .select('namesite, iddetail, _type, _subtype, "area-ha", "area-acre", _naregion, _na_subregion_multi, "recactivities-multi", sapaaweb, inatmap, inspectno, inspectdate, steward, steward_guest, category, definition, county, naturalness_score, naturalness_details, notes')
      .eq('namesite', siteName)
      .order('inspectdate', { ascending: false});
    
    if (error) throw error;
    if (data.length === 0) {
      throw new Error(`No data found for site: ${siteName}`);
    }

    // insert data into local SQLite DB
    for (const insp of data) {
      await database.runAsync(
        `INSERT OR REPLACE INTO inspections 
        (namesite, iddetail, _type, _subtype, area_ha, area_acre, _naregion, _na_subregion_multi, recactivities_multi, sapaaweb, inatmap, inspectno, inspectdate, steward, steward_guest, category, definition, county, naturalness_score, naturalness_details, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [insp.namesite, insp.iddetail, insp._type, insp._subtype, insp['area-ha'], insp['area-acre'], insp._naregion, insp._na_subregion_multi, insp['recactivities-multi'], insp.sapaaweb, insp.inatmap, insp.inspectno, insp.inspectdate, insp.steward, insp.steward_guest, insp.category, insp.definition, insp.county, insp.naturalness_score, insp.naturalness_details, insp.notes]
      );
    }
    
    // save last accessed timestamp (used later for cleanup)
    const metaPath = `${siteDir}meta.json`;
    await FileSystemLegacy.writeAsStringAsync(metaPath, JSON.stringify({ lastAccessed: Date.now() }));

    console.log(`Successfully downloaded site: ${siteName}`);
  } finally {
    // close database
    await database.closeAsync();
  }
};

// get list of downloaded sites from local storage
export const getDownloadedSites = async (): Promise<DownloadedSite[]> => {
  const sitesDir = `${FileSystemLegacy.documentDirectory}sites/`;
  try {
    const siteNames = await FileSystemLegacy.readDirectoryAsync(sitesDir);
    const sites: DownloadedSite[] = [];

    for (const name of siteNames) {
      try {        
        const dbPath = `sites/${name}/data.sqlite`;
        const database = await SQLite.openDatabaseAsync(dbPath);

        try {
          // get latest inspection date
          const latestDateResult = await database.getFirstAsync<InspectionDetail>(
            'SELECT inspectdate FROM inspections WHERE namesite = ? ORDER BY inspectdate DESC LIMIT 1', [name]
          );
          const latestDate = latestDateResult?.inspectdate || '1900-01-01';
    
          // get county
          const countyResult = await database.getFirstAsync<InspectionDetail>(
            'SELECT county FROM inspections WHERE namesite = ? LIMIT 1', [name]
          );
          const county = countyResult?.county || 'N/A';
    
          // read metadata
          const metaPath = `${sitesDir}${name}/meta.json`;
          const metaStr = await FileSystemLegacy.readAsStringAsync(metaPath);
          const meta = JSON.parse(metaStr);
    
          // add site to list
          sites.push({ 
            id: sites.length + 1, // temp id
            namesite: name, 
            county: county,
            inspectdate: latestDate,
            lastAccessed: meta.lastAccessed, 
          });

        } finally {
          await database.closeAsync()
        }
      } catch (err) {
        console.warn(`Skipping invalid site: ${name}`, err);
      } 
    }
    return sites;
  } catch (e) {
    console.warn('Error loading downloaded sites:', e);
    return [];
  }
};

// clean up expired sites
export const cleanupExpiredSites = async (keepDaysUser?: number): Promise<void> => {
  try {
    const sitesDir = `${FileSystemLegacy.documentDirectory}sites/`;
    const info = await FileSystemLegacy.getInfoAsync(sitesDir);

    if (!info.exists) {
      console.log('No sites directory found, nothing to clean up');
      return;
    }

    
    let keepDays = keepDaysUser ?? DEFAULT_AUTO_DELETE_DAYS;
    if (keepDaysUser === undefined) {
      try {
        const storedDaysString = await AsyncStorage.getItem('@SAPAA_autoDeleteDays');
        if (storedDaysString !== null) {
          const storedDays = parseInt(storedDaysString, 10);
          if (!isNaN(storedDays) && storedDays >= 1) {
            keepDays = storedDays;
          } else {
            console.warn(`Invalid auto-delete days stored: ${storedDaysString}, using defualt (${DEFAULT_AUTO_DELETE_DAYS}).`);
          }
        }
      } catch (error) {
        console.warn('Error reading auto-delete settings, using default:', error);
      }
    }

      
    const keepDurationMs = keepDays * 24 * 60 * 60 * 1000;
    console.log(`Checking for sites older than ${keepDays} days (${keepDurationMs} ms)...`);
      
    const dirContents = await FileSystemLegacy.readDirectoryAsync(sitesDir);
    for (const name of dirContents) {
      try {
        const metaPath = `${sitesDir}${name}/meta.json`;
        const metaInfo = await FileSystemLegacy.getInfoAsync(metaPath);

        if (!metaInfo.exists) {
          console.log(`No meta.json for ${name}, skipping`);
          continue;
        }

        const metaContent = await FileSystemLegacy.readAsStringAsync(metaPath);
        const meta: { lastAccessed: number } = JSON.parse(metaContent);

        // check if lastAccessed is older than keepDurationMs
        if (Date.now() - meta.lastAccessed > keepDurationMs) {
          // delete the site folder
          await FileSystemLegacy.deleteAsync(`${sitesDir}${name}`, { idempotent: true });
          console.log(`Deleted expired site: ${name}`);
        }
      } catch (err) {
        console.warn(`Skipping cleanup for ${name}:`, err);
      }
    }
  } catch (e) {
    console.warn('No sites directory or error during cleanup:', e);
  }
};

// delete selected sites from local db (manual delete)
export const manualDeleteSites = async (siteNames: string[]): Promise<void> => {
  // no sites selected
  if (siteNames.length === 0) return;
  // delete each selected site
  try {
    const sitesDir = `${FileSystemLegacy.documentDirectory}sites/`;
    for (const siteName of siteNames) {
      const sitePath = `${sitesDir}${siteName}`;
      await FileSystemLegacy.deleteAsync(sitePath, { idempotent: true });
      console.log(`Manually deleted site: ${siteName}`);
    }
  } catch (err) {
    alert('Deletion failed: ' + (err as Error).message);
  }
};
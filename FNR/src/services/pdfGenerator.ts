import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { SiteSummary, DownloadedSite, InspectionDetail } from './database';

export interface PDFFieldConfig {
  siteName: boolean;
  county: boolean;
  inspectionDate: boolean;
  siteId: boolean;
  type: boolean;
  region: boolean;
  area: boolean;
  recreationalActivities: boolean;
  naturalnessScore: boolean;
  naturalnessDetails: boolean;
  steward: boolean;
  observations: boolean;
  sapaaLink: boolean;
  iNaturalMap: boolean;
}

export const DEFAULT_PDF_FIELDS: PDFFieldConfig = {
  siteName: true,
  county: true,
  inspectionDate: true,
  siteId: true,
  type: true,
  region: true,
  area: true,
  recreationalActivities: true,
  naturalnessScore: true,
  naturalnessDetails: true,
  steward: true,
  observations: true,
  sapaaLink: true,
  iNaturalMap: true,
};

export const PDF_FIELD_LABELS: Record<keyof PDFFieldConfig, string> = {
  siteName: 'Site Name',
  county: 'County',
  inspectionDate: 'Inspection Date',
  siteId: 'Site ID',
  type: 'Type & Subtype',
  region: 'Region',
  area: 'Area (HA/AC)',
  recreationalActivities: 'Recreational Activities',
  naturalnessScore: 'Naturalness Score',
  naturalnessDetails: 'Naturalness Details',
  steward: 'Steward',
  observations: 'Observations',
  sapaaLink: 'SAPAA Link',
  iNaturalMap: 'iNaturalist Map',
};

interface GeneratePDFOptions {
  site: SiteSummary | DownloadedSite;
  inspection: InspectionDetail;
  fields: PDFFieldConfig;
  includeAllInspections?: boolean;
  allInspections?: InspectionDetail[];
}

// Helper function to escape HTML special characters
function escapeHtml(text: any): string {
  // Handle null, undefined, or non-string values
  if (text === null || text === undefined) {
    return '';
  }
  
  // If it's an object or array, stringify it first
  let str: string;
  if (typeof text === 'object') {
    str = JSON.stringify(text);
  } else {
    str = String(text);
  }
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return str.replace(/[&<>"']/g, (m) => map[m]);
}

// Helper to safely get string value
function safeString(value: any, fallback: string = 'N/A'): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  return escapeHtml(value);
}

// ✅ FIXED: Convert new filesystem URI to legacy URI format
function convertToLegacyUri(uri: string): string {
  // Print.printToFileAsync returns URIs like: file:///data/user/0/.../cache/Print/...
  // Legacy filesystem expects: file:///data/user/0/.../cache/Print/...
  // So we just need to ensure it's using the legacy format
  
  // If it's already a file:// URI, it should work with legacy
  if (uri.startsWith('file://')) {
    return uri;
  }
  
  // If it doesn't have file://, add it
  return `file://${uri}`;
}

export async function generateSitePDF(options: GeneratePDFOptions): Promise<string> {
  const { site, inspection, fields, includeAllInspections = false, allInspections = [] } = options;

  try {
    const html = generateHTMLContent(site, inspection, fields, includeAllInspections, allInspections);
    
    // Generate PDF using expo-print
    const { uri } = await Print.printToFileAsync({ html });
    
    console.log('Generated PDF URI:', uri);
    
    // ✅ Convert to legacy URI format
    const legacyUri = convertToLegacyUri(uri);
    
    return legacyUri;
  } catch (error) {
    console.error('PDF generation failed:', error);
    console.error('Site data:', site);
    console.error('Inspection data:', inspection);
    throw new Error(`Failed to generate PDF report: ${error}`);
  }
}

export async function sharePDF(uri: string, siteName: string): Promise<void> {
  try {
    console.log('Sharing PDF from URI:', uri);
    
    // Create a better filename
    const cleanSiteName = String(siteName).replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `SAPAA_${cleanSiteName}_${new Date().toISOString().split('T')[0]}.pdf`;
    const newUri = `${FileSystem.documentDirectory}${fileName}`;
    
    console.log('Copying to:', newUri);
    
    // Copy to a location with a proper name using legacy filesystem
    await FileSystem.copyAsync({
      from: uri,
      to: newUri,
    });

    // Check if sharing is available
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(newUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share SAPAA Report',
        UTI: 'com.adobe.pdf',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('PDF sharing failed:', error);
    throw new Error('Failed to share PDF report');
  }
}

function generateHTMLContent(
    site: SiteSummary | DownloadedSite,
    inspection: InspectionDetail,
    fields: PDFFieldConfig,
    includeAllInspections: boolean,
    allInspections: InspectionDetail[]
  ): string {
  const styles = `
    <style>
      @page {
        margin: 20px;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 20px;
        color: #1F2937;
        line-height: 1.6;
        font-size: 14px;
      }
      .header {
        border-bottom: 3px solid #2E7D32;
        padding-bottom: 15px;
        margin-bottom: 20px;
      }
      .site-name {
        font-size: 24px;
        font-weight: bold;
        color: #2E7D32;
        margin: 0 0 8px 0;
      }
      .subtitle {
        font-size: 12px;
        color: #6B7280;
        margin: 3px 0;
      }
      .section {
        margin: 20px 0;
        padding: 15px;
        background-color: #F9FAFB;
        border-radius: 6px;
        border-left: 4px solid #2E7D32;
        page-break-inside: avoid;
      }
      .section-title {
        font-size: 16px;
        font-weight: bold;
        color: #111827;
        margin: 0 0 12px 0;
      }
      .field-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .field {
        margin: 8px 0;
      }
      .field-label {
        font-weight: 600;
        color: #4B5563;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 2px;
      }
      .field-value {
        color: #1F2937;
        font-size: 13px;
        word-wrap: break-word;
      }
      .observations {
        background-color: white;
        padding: 12px;
        border-radius: 4px;
        margin-top: 8px;
      }
      .observation-item {
        margin: 6px 0;
        padding-left: 18px;
        position: relative;
        font-size: 13px;
      }
      .observation-item:before {
        content: "•";
        position: absolute;
        left: 5px;
        color: #2E7D32;
        font-weight: bold;
      }
      .footer {
        margin-top: 30px;
        padding-top: 15px;
        border-top: 1px solid #E5E7EB;
        text-align: center;
        font-size: 10px;
        color: #9CA3AF;
      }
      .inspection-history {
        margin-top: 15px;
      }
      .inspection-item {
        background: white;
        padding: 12px;
        margin: 8px 0;
        border-radius: 4px;
        border-left: 3px solid #60A5FA;
        page-break-inside: avoid;
      }
      .inspection-date {
        font-weight: bold;
        color: #1E40AF;
        margin-bottom: 6px;
        font-size: 13px;
      }
    </style>
  `;

  let content = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${styles}
      </head>
      <body>
        <div class="header">
  `;

  // Site Name (always included)
  if (fields.siteName) {
    content += `<h1 class="site-name">${safeString(site.namesite, 'Unnamed Site')}</h1>`;
  }

  if (fields.county && site.county) {
    content += `<p class="subtitle">📍 ${safeString(site.county)}</p>`;
  }

  if (fields.inspectionDate && site.inspectdate) {
    try {
      const dateStr = new Date(site.inspectdate).toLocaleDateString();
      content += `<p class="subtitle">Last Inspection: ${dateStr}</p>`;
    } catch (e) {
      content += `<p class="subtitle">Last Inspection: ${safeString(site.inspectdate)}</p>`;
    }
  }

  content += `
        </div>
        
        <div class="section">
          <h2 class="section-title">Site Information</h2>
          <div class="field-grid">
  `;

  if (fields.siteId) {
    content += `
      <div class="field">
        <div class="field-label">Site ID</div>
        <div class="field-value">${safeString(inspection.iddetail)}</div>
      </div>
    `;
  }

  if (fields.type) {
    content += `
      <div class="field">
        <div class="field-label">Type</div>
        <div class="field-value">${safeString(inspection._type)}: ${safeString(inspection._subtype)}</div>
      </div>
    `;
  }

  if (fields.region) {
    content += `
      <div class="field">
        <div class="field-label">Region</div>
        <div class="field-value">${safeString(inspection._naregion)}; ${safeString(inspection._na_subregion_multi)}</div>
      </div>
    `;
  }

  if (fields.area) {
    content += `
      <div class="field">
        <div class="field-label">Area (HA / AC)</div>
        <div class="field-value">${safeString(inspection.area_ha)} / ${safeString(inspection.area_acre)}</div>
      </div>
    `;
  }

  if (fields.recreationalActivities && inspection.recactivities_multi) {
    content += `
      <div class="field">
        <div class="field-label">Recreational Activities</div>
        <div class="field-value">${safeString(inspection.recactivities_multi)}</div>
      </div>
    `;
  }

  if (fields.sapaaLink && inspection.sapaaweb) {
    content += `
      <div class="field">
        <div class="field-label">SAPAA Link</div>
        <div class="field-value">${safeString(inspection.sapaaweb)}</div>
      </div>
    `;
  }

  if (fields.iNaturalMap && inspection.inatmap) {
    content += `
      <div class="field">
        <div class="field-label">iNaturalist Map</div>
        <div class="field-value">${safeString(inspection.inatmap)}</div>
      </div>
    `;
  }

  content += `
          </div>
        </div>
  `;

  // Naturalness Section
  if (fields.naturalnessScore || fields.naturalnessDetails) {
    content += `
      <div class="section">
        <h2 class="section-title">Naturalness Assessment</h2>
    `;

    if (fields.naturalnessScore && inspection.naturalness_score) {
      content += `
        <div class="field">
          <div class="field-label">Score</div>
          <div class="field-value">${safeString(inspection.naturalness_score)}</div>
        </div>
      `;
    }

    if (fields.naturalnessDetails && inspection.naturalness_details) {
      content += `
        <div class="field">
          <div class="field-label">Details</div>
          <div class="field-value">${safeString(inspection.naturalness_details)}</div>
        </div>
      `;
    }

    content += `</div>`;
  }

  // Steward Section
  if (fields.steward && (inspection.steward || inspection.steward_guest)) {
    content += `
      <div class="section">
        <h2 class="section-title">Stewardship</h2>
    `;

    if (inspection.steward) {
      content += `
        <div class="field">
          <div class="field-label">Steward</div>
          <div class="field-value">${safeString(inspection.steward)}</div>
        </div>
      `;
    }

    if (inspection.steward_guest) {
      content += `
        <div class="field">
          <div class="field-label">Steward Guest</div>
          <div class="field-value">${safeString(inspection.steward_guest)}</div>
        </div>
      `;
    }

    content += `</div>`;
  }

  // Observations
  if (fields.observations && inspection.notes) {
    const notesStr = String(inspection.notes || '');
    const observations = notesStr.split('; ').filter(obs => obs.trim() !== '');
    
    if (observations.length > 0) {
      content += `
        <div class="section">
          <h2 class="section-title">Observations</h2>
          <div class="observations">
      `;

      observations.forEach(obs => {
        content += `<div class="observation-item">${safeString(obs)}</div>`;
      });

      content += `
          </div>
        </div>
      `;
    }
  }

  // Inspection History (if requested)
  if (includeAllInspections && allInspections.length > 1) {
    content += `
      <div class="section">
        <h2 class="section-title">Inspection History (${allInspections.length} inspections)</h2>
        <div class="inspection-history">
    `;

    allInspections.forEach(insp => {
      try {
        const dateStr = new Date(insp.inspectdate).toLocaleDateString();
        content += `
          <div class="inspection-item">
            <div class="inspection-date">${dateStr}</div>
            ${insp.naturalness_score ? `<div class="field-value">Score: ${safeString(insp.naturalness_score)}</div>` : ''}
            ${insp.steward ? `<div class="field-value">Steward: ${safeString(insp.steward)}</div>` : ''}
          </div>
        `;
      } catch (e) {
        console.warn('Error formatting inspection history item:', e);
      }
    });

    content += `
        </div>
      </div>
    `;
  }

  content += `
        <div class="footer">
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>SAPAA Site Report - Stewards of Alberta's Protected Areas Association</p>
        </div>
      </body>
    </html>
  `;

  return content;
}

// ✅ FIXED: Generate PDF, copy to documentDirectory for preview compatibility
export async function previewSitePDF(options: {
    site: SiteSummary | DownloadedSite;
    inspection: InspectionDetail;
    fields: PDFFieldConfig;
    includeAllInspections?: boolean;
    allInspections?: InspectionDetail[];
  }): Promise<string> {
    const {
      site,
      inspection,
      fields,
      includeAllInspections = false,
      allInspections = [],
    } = options;
  
    console.log('Generating PDF for preview...');
    
    try {
      // Generate the PDF
      const uri = await generateSitePDF({
        site,
        inspection,
        fields,
        includeAllInspections,
        allInspections,
      });
      
      console.log('Generated PDF URI:', uri);
      
      // ✅ Copy to documentDirectory with a proper name for preview
      const cleanSiteName = String(site.namesite).replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `SAPAA_Preview_${cleanSiteName}_${Date.now()}.pdf`;
      const previewUri = `${FileSystem.documentDirectory}${fileName}`;
      
      console.log('Copying for preview to:', previewUri);
      
      await FileSystem.copyAsync({
        from: uri,
        to: previewUri,
      });
      
      console.log('Preview PDF ready at:', previewUri);
      
      return previewUri;
    } catch (error) {
      console.error('Preview PDF generation failed:', error);
      throw new Error(`Failed to generate preview PDF: ${error}`);
    }
  }
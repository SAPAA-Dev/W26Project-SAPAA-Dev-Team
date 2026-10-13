// What each generator writes. Paths are relative to the repository root.
// Add a module or a table here to put it in a diagram. Order here = order in the diagram.

export const MIGRATIONS = 'webapp/supabase/migrations';
export const TSCONFIG = 'webapp/tsconfig.json';
export const ASSETS = 'docs/assets';
export const IMAGES = 'docs/images';
export const DESIGN_DOC = 'docs/software-design.md';
export const HASHES = 'docs/assets/.diagram-hashes.json';

// Diagrams that only people edit. The drift lint reads them.
export const LINT_GLOBS = [/^Sequence_.*\.mmd$/, /^Architecture\.mmd$/, /^ER_Diagram_Proposed_User_Stories\.mmd$/];

export const ER = {
  file: 'docs/assets/ER_Diagram.mmd',
  marker: 'er',
  // Legacy read models. ER_Diagram_Legacy.mmd and the comments describe them.
  exclude: ['sites_list_fnr', 'sites_detail_fnr_test', 'sites_report_fnr_test'],
  // Tables from other schemas. Their entity block is hand-written in the diagram.
  external: { 'auth.users': 'auth_users' },
  // Entity label prefix and classDef name. Tables not listed are WEB.
  categories: { luperson: 'shared' },
  // Extra text for a column, shown as the Mermaid comment.
  notes: {
    'attachments.storage_key': 'S3 object key',
    'homepage_image_uploads.storage_key': 'S3 object key',
    'S26_pdf_jobs.status': 'pending, processing, complete, failed',
    'S26_pdf_jobs.storage_path': 'S3 key of the PDF',
    'question_keys.category': 'one character, no FK in code',
    'sites_pa.protected_area_id': 'optional protected_areas.id',
    'protected_areas.geometry': 'GeoJSON MultiPolygon',
    'protected_areas.folder': 'KML Folder name',
    'people.activity_points': 'users cannot edit it (1.0.5)',
  },
};

export const MODELS = {
  file: 'docs/assets/UML_Class_Diagram_Models.mmd',
  marker: 'models',
  tables: {
    sites_pa: 'Site',
    ab_counties: 'County',
    site_stewards: 'SiteSteward',
    people: 'Person',
    socials: 'Socials',
    form_responses: 'FormResponse',
    answers: 'Answer',
    questions: 'Question',
    form_sections: 'FormSection',
    question_keys: 'QuestionKey',
    question_options: 'QuestionOption',
    attachments: 'Attachment',
    homepage_image_uploads: 'HomepageImageUpload',
    S26_pdf_jobs: 'PdfJob',
    protected_areas: 'ProtectedArea',
    site_page_fields: 'SitePageField',
    luperson: 'LegacyPerson',
  },
  // Exported TypeScript types that have no table.
  types: [{ class: 'PdfOptions', module: 'webapp/lib/pdf/types.ts', name: 'PdfOptions' }],
};

// One class per entry. `include` picks and orders the exported functions; without it,
// every exported function is shown in source order. A route.ts file shows its handlers.
const q = 'webapp/utils/supabase/queries.ts';
export const SERVICES = {
  file: 'docs/assets/UML_Class_Diagram.mmd',
  marker: 'services',
  namespaces: {
    WebApp: [
      { class: 'WebAuthService', module: 'webapp/services/auth.ts',
        include: ['login', 'signup', 'signInWithGoogle', 'signInWithMicrosoft', 'logout'] },
      { class: 'SiteQueries', module: q,
        include: ['getSitesOnline', 'getSiteByName', 'getCounties', 'getProtectedAreaChoices', 'getProtectedAreaBoundaries',
          'updateSite', 'toggleSiteActive', 'createSite', 'findSitesWithName', 'getSiteSuggestions', 'getSiteLinks',
          'getSitePageFields', 'updateSitePageFields', 'getSiteDeleteImpact', 'archiveSite', 'restoreSite',
          'permanentlyDeleteSite', 'getArchivedSites'] },
      { class: 'InspectionQueries', module: q,
        include: ['addSiteInspectionReport', 'uploadSiteInspectionAnswers', 'insertInspectionAttachments',
          'rollbackSiteInspectionSubmission', 'setFormResponseActive', 'getFormResponsesBySite',
          'getFormResponsesBySiteAdmin', 'getFormResponseById',
          'updateAttachmentMetadata', 'updateSiteInspectionAnswers', 'getResponseOwnerId',
          'getSiteIdForResponse',
          'getSiteInspectionReportDeleteImpact', 'archiveSiteInspectionReport', 'restoreSiteInspectionReport',
          'permanentlyDeleteSiteInspectionReport', 'getArchivedSiteInspectionReports'] },
      { class: 'HomepageImageActions', module: q, include: ['insertHomepageImageUpload'] },
      { class: 'StewardActions', module: 'webapp/utils/steward-actions.ts' },
      { class: 'KmlImportActions', module: 'webapp/utils/kml-import-actions.ts' },
      { class: 'KmlParser', module: 'webapp/lib/map/kmlImport.ts',
        include: ['parseProtectedAreaFile', 'parseProtectedAreaKmlText'] },
      { class: 'S3Delete', module: 'webapp/utils/media/s3Delete.ts' },
      { class: 'ProfileRoute', module: 'webapp/app/api/profile/route.ts' },
      { class: 'PresignRoute', module: 'webapp/app/api/s3/presign/route.ts' },
      { class: 'HomepagePresignRoute', module: 'webapp/app/api/s3/presign-homepage-images/route.ts' },
      { class: 'SiteImagesRoute', module: 'webapp/app/api/site-images/route.ts' },
      { class: 'SiteGalleryRoute', module: 'webapp/app/api/sites/[siteId]/gallery/route.ts' },
      { class: 'HomepageImagesRoute', module: 'webapp/app/api/homepage-images/[siteId]/route.ts' },
      { class: 'PdfRoute', module: 'webapp/app/api/pdf/route.ts' },
      { class: 'PdfStatusRoute', module: 'webapp/app/api/pdf/status/[jobId]/route.ts' },
      { class: 'PdfJobProcessor', module: 'webapp/lib/pdf/processPdfJob.ts' },
      { class: 'PdfDataFetcher', module: 'webapp/lib/pdf/pdfDataFetcher.ts' },
      { class: 'PdfReportQueries', module: 'webapp/lib/pdf/reportQueries.ts' },
      { class: 'GeocodeRoute', module: 'webapp/app/api/geocode/route.ts' },
    ],
    MobileApp: [
      { class: 'StewardLogGeocoder', module: 'FNR/src/services/openCage.ts', include: ['getCoordinatesFromName'] },
    ],
  },
};

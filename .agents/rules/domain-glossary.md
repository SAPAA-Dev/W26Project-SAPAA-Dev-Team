# Domain glossary

SAPAA is the Stewards of Alberta's Protected Areas Association. Volunteer stewards visit protected areas and file inspection reports.

| Term | Meaning | Where in code |
| --- | --- | --- |
| Site | A protected area. There are no latitude or longitude columns. The app geocodes sites by name. | `W26_sites-pa`, `W26_ab_counties`; `webapp/app/admin/sites/`, `webapp/app/api/geocode/`, `FNR/src/services/openCage.ts` |
| Steward | A volunteer who inspects sites. A steward is a `luperson` row. | `webapp/utils/supabase/queries.ts` |
| Admin | A SAPAA staff user. Admins approve accounts and edit forms. | `webapp/app/admin/` |
| SIR | Site Inspection Report. One filled form for one site visit. | `W26_form_responses`, `W26_answers` |
| Naturalness score | A score in the SIR for the condition of the site. | `webapp/utils/supabase/queries.ts` |
| Form editor | The admin tool that changes SIR questions. | `W26_questions`, `W26_question_keys`, `W26_form_sections`, `W26_question_options`; `webapp/app/admin/form-editor/` |
| Attachment | A photo for a SIR. Files go to AWS S3 through presigned URLs, not to Supabase Storage. | `W26_attachments`; `webapp/app/api/s3/`, `webapp/utils/media/` |
| PDF export | A printable SIR. | `webapp/lib/pdf/`, `webapp/app/api/pdf/`, `S26_pdf_jobs`; `FNR/src/services/pdfGenerator.ts` |
| StewardLog | The real name of the mobile app in `FNR/`. | `FNR/` |
| Offline mode | The mobile app keeps a read-only SQLite copy for each site. Offline edits are lost now, and "Sync Now" does not sync. | `FNR/src/services/database.ts` |

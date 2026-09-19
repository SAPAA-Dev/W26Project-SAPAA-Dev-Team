// Add a custom menu to Google Sheets when opened
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Supabase Functions')
    .addSubMenu(ui.createMenu('Get data from Supabase tables')
      .addItem('Get data from LUMemberType', 'fetchLUmembertype')
      .addItem('Get data from LUPerson', 'fetchLUperson')
      .addItem('Get data from InspectQCategory', 'fetchInspectQCategory')
      .addItem('Get data from InspectQuestions', 'fetchInspectQuestions')
      .addItem('Get data from QuestionMapping', 'fetchQuestionMapping')
    )
    .addSeparator()
    .addItem('Step 1 - Convert stewards to foreign keys', 'replaceNamesWithIDs')
    .addItem('Step 2 - Send data to Supabase', 'uploadInspectionBundle')
    .addSeparator()
    .addSubMenu(ui.createMenu('Send Sheets data to Supabase tables')
      .addItem('Sync LUMemberType Sheet with Supabase', 'syncLUMemberType')
      .addItem('Sync LUPerson Sheet with Supabase', 'syncLUPerson')
      .addItem('Sync InspectQCategory Sheet with Supabase', 'syncInspectQCategory')
      .addItem('Sync InspectQuestions Sheet with Supabase', 'syncInspectQuestions')
      .addItem('Sync QuestionMapping Sheet with Supabase', 'syncQuestionMapping')
    )
    .addToUi();
}

// ======== Check Supabase connection and supply URL and key if working ========
function checkSupabaseConnection() {
  const props = PropertiesService.getScriptProperties(); // Keys are stored in Script Properties
  const url = props.getProperty("PROD_URL"); // REPLACE WITH DEV_URL FOR TESTING WITH SECONDARY DB
  const key = props.getProperty("PROD_KEY"); // REPLACE WITH DEV_KEY FOR TESTING WITH SECONDARY DB

  if (!url || !key) {
    SpreadsheetApp.getUi().alert("Missing Supabase credentials in Script Properties.");
    return false;
  }

  try { // Use luperson table as health check target
    const req = UrlFetchApp.fetch(`${url}/rest/v1/luperson?select=id&limit=1`, {
      method: "get",
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`
      },
      muteHttpExceptions: true
    });

    if (req.getResponseCode() !== 200) {
      SpreadsheetApp.getUi().alert("Supabase connection test failed. Please check URL or API key.");
      return false;
    }
    return { url, key }; // Valid connection
  } catch (err) {
    SpreadsheetApp.getUi().alert(`Error checking Supabase connection:\n${err}`);
    return false;
  }
}

// ======== Converting Stewards to their matching IDs in LUPerson ========

function replaceNamesWithIDs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet1 = ss.getSheetByName("Form Data");
  const sheet2 = ss.getSheetByName("LUPerson");
  const ui = SpreadsheetApp.getUi();

  if (!sheet1 || !sheet2) {
    ui.alert("Required sheets not found. Please ensure 'Form Data' and 'LUPerson' exist.");
    return;
  }

  // Fetch name list from "Form Data" (column F)
  const lastRow = sheet1.getLastRow();
  if (lastRow < 2) {
    ui.alert("No data found in 'Form Data'. Nothing to replace.");
    return;
  }

  const namesSheet1 = sheet1.getRange(`F2:F${lastRow}`).getValues();

  // Fetch ID-name pairs from "LUPerson"
  const dataSheet2 = sheet2.getRange(`A2:D${sheet2.getLastRow()}`).getValues();

  // Build a lookup map: { normalizedName: ID }
  const nameToID = {};
  dataSheet2.forEach(([id, , , name]) => {
    if (id && name) {
      nameToID[name.trim().toLowerCase()] = id;
    }
  });

  // Replace names with IDs and collect missing names
  const missingNames = new Set();
  const updatedValues = namesSheet1.map(([name]) => {
    const clean = name ? name.trim().toLowerCase() : "";
    if (!clean) return [""];
    const matchedID = nameToID[clean];
    if (matchedID) return [matchedID];
    missingNames.add(name); // keep original case for alert clarity
    return [name];
  });

  // Abort and alert if there are any missing names
  if (missingNames.size > 0) {
    const missingList = Array.from(missingNames).join(", ");
    ui.alert(
      `Some names could not be matched to IDs:\n\n${missingList}\n\nNo changes were made.`
    );
    return;
  }

  // Write replacements only if all names were valid
  sheet1.getRange(`F2:F${lastRow}`).setValues(updatedValues);
  ss.toast("Names successfully replaced with IDs.");
}

// ======== Getting and setting data between Google Sheets and Supabase ========

// ======== Helper: Fetch and write to the corresponding sheet ======== 
function fetchAndWriteToSheet(table, sheetName) {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Step 0: Verify connection
  const conn = checkSupabaseConnection();
  if (!conn) return;
  const { url, key } = conn;

  // Step 1: Validate inputs
  if (!table || !sheetName) {
    ui.alert("Missing table or sheet name parameter.");
    return;
  }

  // Step 2: Prepare request
  const endpoint = `${url}/rest/v1/${table}?select=*`;
  const options = {
    method: "get",
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    muteHttpExceptions: true,
  };

  // Step 3: Fetch data
  let response, status, data;
  try {
    response = UrlFetchApp.fetch(endpoint, options);
    status = response.getResponseCode();

    if (status >= 300) {
      // Supabase-specific error reporting
      const body = response.getContentText();
      console.error(`Error fetching table '${table}':`, body);
      ui.alert(`Failed to fetch "${table}".\n\nStatus: ${status}\nResponse: ${body}`);
      return;
    }

    data = JSON.parse(response.getContentText());
  } catch (err) {
    console.error(`Exception during fetch from '${table}':`, err);
    ui.alert(`Unexpected error fetching data from "${table}":\n${err}`);
    return;
  }

  // Step 4: Handle empty response
  if (!Array.isArray(data) || data.length === 0) {
    ui.alert(`No data returned from table: ${table}`);
    return;
  }

  // Step 5: Prepare sheet
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  sheet.clearContents();

  // Step 6: Write headers and data
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => row[h] ?? "")); // null-safe

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

  // Step 7: Completion message
  ss.toast(`Fetched ${rows.length} rows from "${table}" into "${sheetName}".`);
}

// ======= Individual functions per table  ========

// LUPerson
function fetchLUperson() {
  fetchAndWriteToSheet("luperson", "LUPerson");
}

// LUMemberType
function fetchLUmembertype() {
  fetchAndWriteToSheet("lumembertype", "LUMemberType");
}

// InspectQCategory
function fetchInspectQCategory() {
  fetchAndWriteToSheet("inspectqcategory", "InspectQCategory");
}

// InspectQuestions
function fetchInspectQuestions() {
  fetchAndWriteToSheet("inspectquestions", "InspectQuestions");
}

// QuestionMapping
function fetchQuestionMapping() {
  fetchAndWriteToSheet("questionmapping", "QuestionMapping");
}

// ======== Sync Sheet with Supabase Table ========
function syncTableWithSupabase(table, sheetName, uniqueKey = "id") {
  const ui = SpreadsheetApp.getUi();
  const conn = checkSupabaseConnection();
  if (!conn) return;
  const { url, key } = conn;

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return ui.alert(`Sheet "${sheetName}" not found.`);

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return ui.alert(`No data found in "${sheetName}".`);
    const headers = data[0];
    const rows = data.slice(1).filter(r => r.join("").trim() !== "");

    const keyIndex = headers.indexOf(uniqueKey);
    if (keyIndex === -1) return ui.alert(`Unique key "${uniqueKey}" not found in sheet "${sheetName}".`);

    // Step 1: Fetch Supabase data
    let supaData;
    try {
      const fetchRes = UrlFetchApp.fetch(`${url}/rest/v1/${table}?select=*`, {
        method: "get",
        headers: { "apikey": key, "Authorization": `Bearer ${key}` },
        muteHttpExceptions: true,
      });

      if (fetchRes.getResponseCode() !== 200) {
        throw new Error(`Supabase returned ${fetchRes.getResponseCode()}: ${fetchRes.getContentText()}`);
      }

      supaData = JSON.parse(fetchRes.getContentText());
    } catch (err) {
      return ui.alert(`Failed to fetch existing data from "${table}".\n\n${err}`);
    }

    // Step 2: Index both sides for comparison
    const sheetMap = new Map(rows.map(r => [String(r[keyIndex]).trim(), Object.fromEntries(headers.map((h, i) => [h, r[i]]))]));
    const supaMap = new Map(supaData.map(obj => [String(obj[uniqueKey]).trim(), obj]));

    const toInsert = [];
    const toUpdate = [];
    const toDelete = [];

    // Step 3: Detect inserts and updates
    sheetMap.forEach((sheetRow, keyVal) => {
      const supaRow = supaMap.get(keyVal);
      if (!supaRow) {
        toInsert.push(sheetRow);
      } else {
        const changed = headers.some(h => String(sheetRow[h] ?? "") !== String(supaRow[h] ?? ""));
        if (changed) toUpdate.push(sheetRow);
      }
    });

    // Step 4: Detect deletions
    supaMap.forEach((supaRow, keyVal) => {
      if (!sheetMap.has(keyVal)) {
        toDelete.push(supaRow);
      }
    });

    // Step 5: No changes
    if (toInsert.length === 0 && toUpdate.length === 0 && toDelete.length === 0) {
      ui.alert(`No changes detected between "${sheetName}" and "${table}".`);
      return;
    }

    // Step 6: Summarize changes
    const summary = [
      `Changes detected for "${table}":`,
      `+ ${toInsert.length} to insert`,
      `~ ${toUpdate.length} to update`,
      `- ${toDelete.length} to delete`,
      ``,
      `Proceed with sync?`
    ].join("\n");

    const proceed = ui.alert("Confirm Sync", summary, ui.ButtonSet.YES_NO);
    if (proceed !== ui.Button.YES) return;

    // Step 7a: Insert new rows
    if (toInsert.length > 0) {
      const insertRes = UrlFetchApp.fetch(`${url}/rest/v1/${table}`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "apikey": key,
          "Authorization": `Bearer ${key}`,
          "Prefer": "return=representation,resolution=ignore-duplicates",
        },
        payload: JSON.stringify(toInsert),
        muteHttpExceptions: true,
      });
      if (insertRes.getResponseCode() >= 300) {
        throw new Error(`Insert failed (${insertRes.getResponseCode()}): ${insertRes.getContentText()}`);
      }
    }

    // Step 7b: Update modified rows
    for (const row of toUpdate) {
      const recordId = row[uniqueKey];
      const filtered = Object.fromEntries(Object.entries(row).filter(([k]) => k !== uniqueKey));
      const updateRes = UrlFetchApp.fetch(`${url}/rest/v1/${table}?${uniqueKey}=eq.${encodeURIComponent(recordId)}`, {
        method: "patch",
        headers: {
          "Content-Type": "application/json",
          "apikey": key,
          "Authorization": `Bearer ${key}`,
        },
        payload: JSON.stringify(filtered),
        muteHttpExceptions: true,
      });
      if (updateRes.getResponseCode() >= 300) {
        throw new Error(`Update failed for record ${recordId} (${updateRes.getResponseCode()}): ${updateRes.getContentText()}`);
      }
    }

    // Step 7c: Delete removed rows
    if (toDelete.length > 0) {
      const ids = toDelete.map(r => r[uniqueKey]).filter(Boolean).map(encodeURIComponent).join(",");
      const deleteRes = UrlFetchApp.fetch(`${url}/rest/v1/${table}?${uniqueKey}=in.(${ids})`, {
        method: "delete",
        headers: { "apikey": key, "Authorization": `Bearer ${key}` },
        muteHttpExceptions: true,
      });
      if (deleteRes.getResponseCode() >= 300) {
        throw new Error(`Delete failed (${deleteRes.getResponseCode()}): ${deleteRes.getContentText()}`);
      }
    }

    // Step 8: Notify success
    ui.alert(`Sync complete for "${table}".\nInserted: ${toInsert.length}\nUpdated: ${toUpdate.length}\nDeleted: ${toDelete.length}`);
  } catch (err) {
    const errorMsg = `Error during sync for table "${table}":\n\n${err.message || err}\n\nStack trace (if available):\n${err.stack || "N/A"}`;
    console.error(errorMsg);
    ui.alert(errorMsg);
  }
}

// ======== Individual functions per table for syncing ========

// LUMemberType
function syncLUMemberType() {
  syncTableWithSupabase("lumembertype", "LUMemberType", "id");
}

// LUPerson
function syncLUPerson() {
  syncTableWithSupabase("luperson", "LUPerson", "id");
}

// InspectQuestions
function syncInspectQuestions() {
  syncTableWithSupabase("inspectquestions", "InspectQuestions", "id");
}

// InspectQCategory
function syncInspectQCategory() {
  syncTableWithSupabase("inspectqcategory", "InspectQCategory", "id");
}

// QuestionMapping
function syncQuestionMapping() {
  syncTableWithSupabase("questionmapping", "QuestionMapping", "id");
}

// ======== Send data to Supabase tables ========
function uploadInspectionBundle() {
  const ui = SpreadsheetApp.getUi();

    // Step 0: Setup and read Supabase credentials
    const conn = checkSupabaseConnection();
    if (!conn) return;
    const { url, key } = conn;

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Step 1: Validate Data for InspectHeader
    const headerSheet = ss.getSheetByName("Data for InspectHeader");
    if (!headerSheet) return ui.alert('Sheet "Data for InspectHeader" not found.');
    const headerData = headerSheet.getDataRange().getValues();
    if (headerData.length < 2) return ui.alert("No data row found in Data for InspectHeader.");

    // Step 1.5: Check if inspection record number already exists in Supabase
    const headerCols = headerData[0];
    const headerRow = headerData[1];
    const inspectionField = "inspectno"; // Name of column with Inspection Number
    const inspectionValue = headerRow[headerCols.indexOf(inspectionField)];

    if (!inspectionValue) return ui.alert(`Missing '${inspectionField}' value in Data for InspectHeader.`);

    try {
      const checkUrl = `${url}/rest/v1/inspectheader?${inspectionField}=eq.${encodeURIComponent(inspectionValue)}&select=id`;
      const checkRes = UrlFetchApp.fetch(checkUrl, {
        method: "get",
        headers: { "apikey": key, "Authorization": `Bearer ${key}` },
        muteHttpExceptions: true,
      });

      const status = checkRes.getResponseCode();
      const body = checkRes.getContentText();
      if (status >= 300) {
        return ui.alert(`Error verifying inspection record uniqueness:\nStatus: ${status}\n${body}`);
      }

      const existing = JSON.parse(body);
      if (existing.length > 0) {
        return ui.alert(
          `Duplicate record detected.\nAn inspection with "${inspectionField}" = "${inspectionValue}" already exists.\nUpload aborted.`
        );
      }
    } catch (err) {
      return ui.alert(`Error verifying inspection record uniqueness:\n${err}`);
    }

    if (headerCols.length !== headerRow.length || headerCols.includes(""))
      return ui.alert("Invalid header sheet structure or empty headers.");

    // Step 2: Validate Data for InspectDetails
    const detailsSheet = ss.getSheetByName("Data for InspectDetails");
    if (!detailsSheet) return ui.alert('Sheet "Data for InspectDetails" not found.');
    const detailsData = detailsSheet.getDataRange().getValues();
    const detailHeaders = detailsData[0];
    const detailRows = detailsData.slice(1).filter(r => r.join("").trim() !== "");
    if (!detailRows.length) return ui.alert("No data rows found in Data for InspectDetails.");
    if (detailHeaders.includes("")) return ui.alert("Blank column header found in Data for InspectDetails.");

    const inspectionIndex = detailHeaders.findIndex(h => h.trim().toUpperCase() === "INSPECTION");
    if (inspectionIndex === -1) return ui.alert("Column 'Inspection' not found in Data for InspectDetails.");

    // Step 3: Fetch max IDs from Supabase
    const getMaxId = table => {
      try {
        const res = UrlFetchApp.fetch(`${url}/rest/v1/${table}?select=id&order=id.desc&limit=1`, {
          method: "get",
          headers: { "apikey": key, "Authorization": `Bearer ${key}` },
          muteHttpExceptions: true,
        });
        const status = res.getResponseCode();
        const body = res.getContentText();
        if (status >= 300) throw new Error(`${table} responded with ${status}: ${body}`);
        const json = JSON.parse(body);
        return json.length ? parseInt(json[0].id, 10) : 0;
      } catch (err) {
        throw new Error(`Failed to get max ID for ${table}: ${err}`);
      }
    };

    let maxHeaderId, maxDetailId;
    try {
      maxHeaderId = getMaxId("inspectheader");
      maxDetailId = getMaxId("inspectdetails");
    } catch (err) {
      return ui.alert(`Error fetching max IDs:\n${err}`);
    }

    // Step 4: Build payloads 
    const newHeaderId = maxHeaderId + 1;
    const headerRecord = {};
    headerCols.forEach((h, i) => {
      if (h.trim().toUpperCase() !== "ID") headerRecord[h] = headerRow[i];
    });
    headerRecord.id = newHeaderId;

    let nextDetailId = maxDetailId + 1;
    const detailRecords = detailRows.map(row => {
      const obj = {};
      detailHeaders.forEach((h, i) => {
        if (h.trim().toUpperCase() !== "ID") {
          obj[h] = (i === inspectionIndex) ? newHeaderId : row[i];
        }
      });
      obj.id = nextDetailId++;
      return obj;
    });

    // Step 5: Validate payloads locally before upload
    const invalidDetail = detailRecords.find(d => !d.inspection || !d.id);
    if (invalidDetail) return ui.alert("Invalid InspectDetails data detected. Aborting upload. There was an issue mapping data.");

    // Step 6: Confirm with user
    const confirmMsg = `Ready to upload:\n` +
      `- 1 record to inspectheader (new ID: ${newHeaderId})\n` +
      `- ${detailRecords.length} records to inspectdetails (starting ID: ${maxDetailId + 1})\n\nProceed?`;
    const proceed = ui.alert("Confirm Upload", confirmMsg, ui.ButtonSet.YES_NO);
    if (proceed !== ui.Button.YES) return;

  // Step 7: Upload InspectHeader
    let headerReq;
    try {
      headerReq = UrlFetchApp.fetch(`${url}/rest/v1/inspectheader`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "apikey": key,
          "Authorization": `Bearer ${key}`,
          "Prefer": "return=representation,resolution=ignore-duplicates",
        },
        payload: JSON.stringify([headerRecord]),
        muteHttpExceptions: true,
      });
    } catch (err) {
      return ui.alert(`Network error during InspectHeader upload:\n${err}`);
    }

    const headerStatus = headerReq.getResponseCode();
    const headerBody = headerReq.getContentText();
    if (headerStatus >= 300) {
      return ui.alert(`InspectHeader upload failed.\n\nStatus: ${headerStatus}\nMessage:\n${headerBody}`);
    }

  // Step 8: Upload InspectDetails
    let detailsReq;
    try {
      detailsReq = UrlFetchApp.fetch(`${url}/rest/v1/inspectdetails`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "apikey": key,
          "Authorization": `Bearer ${key}`,
          "Prefer": "return=representation,resolution=ignore-duplicates",
        },
        payload: JSON.stringify(detailRecords),
        muteHttpExceptions: true,
      });
    } catch (err) {
      return ui.alert(`Network error during InspectDetails upload:\n${err}`);
    }

    const detailsStatus = detailsReq.getResponseCode();
    const detailsBody = detailsReq.getContentText();
    console.log("InspectDetails upload response:", detailsStatus, detailsBody);

    if (detailsStatus >= 300) {
      const failMsg = `InspectDetails upload failed.\n\nStatus: ${detailsStatus}\nMessage:\n${detailsBody}`;
      try {
        UrlFetchApp.fetch(`${url}/rest/v1/inspectheader?id=eq.${newHeaderId}`, {
          method: "delete",
          headers: { "apikey": key, "Authorization": `Bearer ${key}` },
        });
        ui.alert(`${failMsg}\n\nInspectHeader rolled back successfully.`);
      } catch (rollbackErr) {
        ui.alert(`${failMsg}\n\nRollback also failed:\n${rollbackErr}`);
      }
      return;
    }

    // Step 9: Final success message
    ui.alert(
      `Upload successful.\n\nInspectHeader ID: ${newHeaderId}\nInspectDetails uploaded: ${detailRecords.length}`
    );
}
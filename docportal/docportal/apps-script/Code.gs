// ============================================================
// DocPortal — Google Apps Script
// Deployá esto como Web App en: script.google.com
// ============================================================

const FOLDER_ID = '1ytvTwjvD0TAZ8Uh3je3myZTDHq2BRHwq';

function doGet(e) {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const files   = folder.getFiles();
    const result  = [];

    while (files.hasNext()) {
      const file = files.next();
      result.push({
        id:           file.getId(),
        name:         file.getName(),
        mimeType:     file.getMimeType(),
        modifiedTime: file.getLastUpdated().toISOString(),
        description:  file.getDescription() || '',
        webViewLink:  file.getUrl()
      });
    }

    // Ordenar por fecha de modificación (más reciente primero)
    result.sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));

    return ContentService
      .createTextOutput(JSON.stringify({ files: result }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    // No exponer detalles internos del error
    return ContentService
      .createTextOutput(JSON.stringify({ files: [], error: 'No se pudo leer la carpeta' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

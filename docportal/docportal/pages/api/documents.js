// Llama al Google Apps Script Web App que expone la carpeta de Drive como JSON.
// No requiere autenticación de usuario ni Google Cloud.

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL

// Allowlist SSRF: se permiten ambos formatos de Apps Script de Google
// - Cuentas personales: https://script.google.com/macros/s/
// - Cuentas Workspace/corporativas: https://script.google.com/a/macros/
const isAllowedAppsScriptUrl = (url) =>
  url.startsWith('https://script.google.com/macros/s/') ||
  url.startsWith('https://script.google.com/a/macros/')

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  // Validar que la URL configurada sea un Apps Script legítimo (previene SSRF)
  if (!APPS_SCRIPT_URL || !isAllowedAppsScriptUrl(APPS_SCRIPT_URL)) {

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      redirect: 'follow', // Apps Script redirige una vez antes de responder
      signal: AbortSignal.timeout(10000) // timeout de 10s
    })

    if (!response.ok) {
      throw new Error(`Apps Script respondió con status ${response.status}`)
    }

    const data = await response.json()

    // Devolver directamente — los campos ya vienen escapados desde el script
    return res.status(200).json({ files: data.files || [] })
  } catch (error) {
    // Nunca exponer detalles internos al cliente
    console.error('[documents] Error llamando Apps Script:', error.message)
    return res.status(500).json({ error: 'Error al obtener documentos' })
  }
}

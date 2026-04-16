import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'

const MAX_CONTEXT_CHARS = 8000

// Allowlist SSRF: solo se permite fetch a dominios de Google Docs
const ALLOWED_DOC_PREFIXES = [
  'https://docs.google.com/document/d/',
  'https://spreadsheets.google.com/',
]

// Schema estricto de entrada — rechaza cualquier campo extra
const bodySchema = z.object({
  message: z.string().min(1).max(1000),
  fileId: z.string().regex(/^[a-zA-Z0-9_-]{10,60}$/).optional()
}).strict()

function buildExportUrl(fileId) {
  return `https://docs.google.com/document/d/${fileId}/export?format=txt`
}

function isAllowedDocUrl(url) {
  return ALLOWED_DOC_PREFIXES.some(prefix => url.startsWith(prefix))
}

async function fetchDocContent(fileId) {
  const exportUrl = buildExportUrl(fileId)
  // Validar contra allowlist antes del fetch (previene SSRF)
  if (!isAllowedDocUrl(exportUrl)) return null
  try {
    const res = await fetch(exportUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(8000)
    })
    if (!res.ok) return null
    const text = await res.text()
    return text.substring(0, MAX_CONTEXT_CHARS)
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('[chat] GEMINI_API_KEY no configurada')
    return res.status(503).json({ error: 'Bot no configurado' })
  }

  // Validar input con schema estricto
  const parsed = bodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Mensaje inválido' })
  }

  const { message, fileId } = parsed.data

  try {
    let documentContext = ''
    if (fileId) {
      const content = await fetchDocContent(fileId)
      if (content) documentContext = content
    }

    // API key solo se usa server-side — nunca se expone al cliente
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const systemInstruction = documentContext
      ? `Sos un asistente de documentos corporativos. Respondé SIEMPRE en español, claro y conciso. Basate ÚNICAMENTE en el siguiente documento:\n\n---\n${documentContext}\n---\n\nSi la pregunta no puede responderse con este contenido, decilo claramente. No inventes información.`
      : `Sos un asistente de documentos corporativos. Respondé SIEMPRE en español, claro y conciso. Ayudá al equipo con preguntas sobre procedimientos, políticas y guías. Si necesitás contexto específico, pedile al usuario que seleccione un documento.`

    const result = await model.generateContent({
      systemInstruction,
      contents: [{ role: 'user', parts: [{ text: message }] }],
      generationConfig: { maxOutputTokens: 1024 }
    })

    const reply = result.response.text()

    // reply es texto plano — React lo renderiza de forma segura sin innerHTML
    return res.status(200).json({ reply })
  } catch (error) {
    // Nunca exponer detalles internos al cliente
    console.error('[chat] Error:', error.message)
    return res.status(500).json({ error: 'Error al procesar la consulta' })
  }
}

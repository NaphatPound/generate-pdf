# Generate PDF

A Next.js application for creating, editing, and generating PDF documents with variable placeholders. Uses MinIO (S3-compatible) for file storage.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Ant Design 5
- **Database:** SQLite via Prisma ORM
- **PDF Generation:** html2canvas + jsPDF (client-side)
- **Template Editor:** TipTap (ProseMirror-based WYSIWYG)
- **File Storage:** MinIO (S3-compatible)

---

## Getting Started

### Prerequisites

- Node.js 20+
- MinIO server running (or S3-compatible service)

### Environment Variables

Copy `.env` to the project root (already present locally):

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `file:./prisma/dev.db` | SQLite database path |
| `MINIO_ENDPOINT` | `localhost` | MinIO server host |
| `MINIO_PORT` | `9000` | MinIO API port |
| `MINIO_USE_SSL` | `false` | Use HTTPS for MinIO |
| `MINIO_ACCESS_KEY` | `minioadmin` | MinIO access key |
| `MINIO_SECRET_KEY` | `minioadmin` | MinIO secret key |
| `MINIO_BUCKET_NAME` | `pdf-generator` | MinIO bucket name |
| `MINIO_PUBLIC_URL` | _(empty)_ | Override presigned URL host |

### Install & Run

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
# Server starts at http://localhost:3000
```

### Seed Data

```bash
npm run prisma:seed
```

Creates an "Invoice Template" with 16 variables.

---

## API Endpoints

### Templates

#### `GET /api/templates`

List all PDF templates, optionally filtered by search.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `search` | `string` | Filter by name or description (partial match) |

**Response `200`:**

```json
[
  {
    "id": "cmpdv3qyd00003oet5ylqr36x",
    "name": "Invoice Template",
    "description": "Standard invoice template...",
    "content": "<!DOCTYPE html>\\n<html>...",
    "variables": "[{\"name\":\"companyName\",\"label\":\"Company Name\",\"type\":\"text\",\"defaultValue\":\"Acme Corporation\"},...]",
    "createdAt": "2026-05-20T09:31:11.798Z",
    "updatedAt": "2026-05-20T09:31:11.798Z"
  }
]
```

**Curl:**

```bash
curl http://localhost:3000/api/templates
curl "http://localhost:3000/api/templates?search=Invoice"
```

---

#### `GET /api/templates/[id]`

Get a single template by ID.

**Response `200`:** Single template object (same schema as list)
**Response `404`:** `{ "error": "Template not found" }`

**Curl:**

```bash
curl http://localhost:3000/api/templates/cmpdv3qyd00003oet5ylqr36x
```

---

#### `POST /api/templates`

Create a new template.

**Request Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | Template name |
| `description` | `string` | No | Brief description |
| `content` | `string` | Yes | Full HTML content (with `{{variable}}` placeholders) |
| `variables` | `string` | No | JSON string of variable definitions (see below) |

**Variable Definition Format:**

```json
[
  {
    "name": "customerName",
    "label": "Customer Name",
    "type": "text",
    "defaultValue": ""
  }
]
```

- `type`: `"text"` or `"textarea"`
- Variables are auto-extracted from `{{name}}` patterns in content when saving via the editor

**Response `201`:** Created template object
**Response `400`:** `{ "error": "Name and content are required" }`

**Curl:**

```bash
curl -X POST http://localhost:3000/api/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Template",
    "description": "A sample template",
    "content": "<h1>{{title}}</h1><p>{{body}}</p>",
    "variables": "[{\"name\":\"title\",\"label\":\"Title\",\"type\":\"text\",\"defaultValue\":\"\"},{\"name\":\"body\",\"label\":\"Body\",\"type\":\"textarea\",\"defaultValue\":\"\"}]"
  }'
```

---

#### `PUT /api/templates/[id]`

Update a template (partial update — only send fields to change).

**Request Body:** Any subset of:

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Template name |
| `description` | `string` | Description |
| `content` | `string` | Full HTML content |
| `variables` | `string` | JSON string of variable definitions |

**Response `200`:** Updated template object

**Curl:**

```bash
curl -X PUT http://localhost:3000/api/templates/cmpdv3qyd00003oet5ylqr36x \
  -H "Content-Type: application/json" \
  -d '{
    "content": "<h1>{{title}}</h1><p>{{body}}</p><p>{{newField}}</p>",
    "variables": "[{\"name\":\"title\",\"label\":\"Title\",\"type\":\"text\",\"defaultValue\":\"\"},{\"name\":\"body\",\"label\":\"Body\",\"type\":\"textarea\",\"defaultValue\":\"\"},{\"name\":\"newField\",\"label\":\"New Field\",\"type\":\"text\",\"defaultValue\":\"\"}]"
  }'
```

---

#### `DELETE /api/templates/[id]`

Delete a template and all its generated PDFs (cascade deletes DB records, but NOT MinIO files).

**Response `200`:** `{ "message": "Template deleted successfully" }`

**Curl:**

```bash
curl -X DELETE http://localhost:3000/api/templates/cmpdv3qyd00003oet5ylqr36x
```

---

### PDF Generation & Storage

#### `POST /api/templates/[id]/generate`

Upload a generated PDF for a template. Stores the file in MinIO and creates a database record.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | `file` | Yes | The PDF file to upload |
| `fileName` | `string` | Yes | Name for the stored file |
| `data` | `string` | No | JSON string of variable values used for generation |

**Response `201`:**

```json
{
  "id": "cmpdxgbpr0003379qy604ru5a",
  "templateId": "cmpdv3qyd00003oet5ylqr36x",
  "templateName": "Invoice Template",
  "data": "{\"customerName\":\"Test User\"}",
  "fileName": "test-from-curl.pdf",
  "filePath": "1779273417798-test-from-curl.pdf",
  "fileSize": 588,
  "pageCount": null,
  "createdAt": "2026-05-20T10:36:57.807Z",
  "pdfUrl": "1779273417798-test-from-curl.pdf"
}
```

**Curl:**

```bash
TEMPLATE_ID="cmpdv3qyd00003oet5ylqr36x"

curl -X POST "http://localhost:3000/api/templates/${TEMPLATE_ID}/generate" \
  -F "file=@/path/to/document.pdf" \
  -F 'data={"customerName":"Test User","companyName":"Test Corp"}' \
  -F 'fileName=output.pdf'
```

---

### Generated PDFs

#### `GET /api/pdfs`

List all generated PDFs, optionally filtered by template.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `templateId` | `string` | Filter by template ID |

**Response `200`:**

```json
[
  {
    "id": "cmpdxgbpr0003379qy604ru5a",
    "templateId": "cmpdv3qyd00003oet5ylqr36x",
    "templateName": "Invoice Template",
    "data": "{\"customerName\":\"Test User\"}",
    "fileName": "output.pdf",
    "filePath": "1779273417798-output.pdf",
    "fileSize": 588,
    "pageCount": null,
    "createdAt": "2026-05-20T10:36:57.807Z",
    "pdfUrl": "http://localhost:9000/pdf-generator/1779273417798-output.pdf?..."
  }
]
```

- `pdfUrl` is a presigned URL valid for 7 days (null if MinIO is unreachable)

**Curl:**

```bash
curl "http://localhost:3000/api/pdfs?templateId=cmpdv3qyd00003oet5ylqr36x"
```

---

#### `GET /api/pdfs/[id]`

Get a single generated PDF with its presigned URL.

**Response `200`:** Single PDF object (includes `pdfUrl` and nested `template`)

**Curl:**

```bash
curl http://localhost:3000/api/pdfs/cmpdxgbpr0003379qy604ru5a
```

---

#### `DELETE /api/pdfs/[id]`

Delete a generated PDF — removes the file from MinIO and deletes the database record.

**Response `200`:** `{ "message": "PDF deleted successfully" }`

**Curl:**

```bash
curl -X DELETE http://localhost:3000/api/pdfs/cmpdxgbpr0003379qy604ru5a
```

---

## Data Models

### PdfTemplate (table: `pdf_templates`)

| Field | Type | Description |
|---|---|---|
| `id` | `String` (CUID) | Primary key |
| `name` | `String` | Template name |
| `description` | `String?` | Optional description |
| `content` | `String` | Full HTML document with `{{variable}}` placeholders |
| `variables` | `String` (JSON) | Variable definitions array as JSON string |
| `createdAt` | `DateTime` | Auto-set on create |
| `updatedAt` | `DateTime` | Auto-updated |

### GeneratedPdf (table: `generated_pdfs`)

| Field | Type | Description |
|---|---|---|
| `id` | `String` (CUID) | Primary key |
| `templateId` | `String` | FK to PdfTemplate (cascade delete) |
| `templateName` | `String` | Snapshot of template name at generation time |
| `data` | `String` (JSON) | Variable values used for generation |
| `fileName` | `String` | Original file name |
| `filePath` | `String` | MinIO object key |
| `fileSize` | `Int?` | File size in bytes |
| `pageCount` | `Int?` | Number of pages (not yet populated) |
| `createdAt` | `DateTime` | Auto-set |

---

## Template Variables

Variables are defined as `{{variableName}}` inside the HTML content. They are:

- **Rendered visually** as blue clickable tags in the rich editor
- **Auto-extracted** on save — new `{{name}}` patterns are detected
- **Auto-configured** — existing variables preserve their label/type/defaultValue; new ones get auto-generated labels
- **Substituted** during PDF generation with user-provided values

**Variable JSON structure:**

```json
[
  {
    "name": "customerName",
    "label": "Customer Name",
    "type": "text",
    "defaultValue": ""
  }
]
```

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Matches `{{name}}` in content |
| `label` | `string` | Display label in the form |
| `type` | `"text" | "textarea"` | Input type |
| `defaultValue` | `string` | Default value |

---

## Frontend Pages

| Route | Description |
|---|---|
| `/` | Home page |
| `/templates` | List all templates (search, create, navigate) |
| `/templates/new` | Create a new template with rich editor |
| `/templates/[id]` | Template detail: generate PDF, WYSIWYG editor, history |
| `/pdfs` | List all generated PDFs with download |
| `/pdfs/[id]` | Single PDF preview (iframe) and download |

---

## Architecture

```
Client (React/Ant Design)
  │
  ├─ /api/templates        ──► Prisma ──► SQLite
  ├─ /api/templates/[id]   ──► Prisma ──► SQLite
  ├─ /api/templates/[id]/generate ──► Prisma + MinIO
  ├─ /api/pdfs             ──► Prisma + MinIO (presigned URLs)
  └─ /api/pdfs/[id]        ──► Prisma + MinIO (presigned URLs / delete)
```

- **PDF Generation:** Client-side via `html2canvas` (DOM → Canvas) + `jsPDF` (Canvas → PDF blob) → blob uploaded to API
- **File Storage:** MinIO (S3-compatible). Files stored with `{timestamp}-{fileName}` key
- **File Access:** 7-day presigned URLs generated on read

# Lumen — PDF Chapter Summaries

Upload any PDF and get instant chapter-wise summaries, key concepts, critical analysis, and revision questions — all processed in the browser with no server or paid API required.

## Tech stack

- **React 18** + **TypeScript**
- **Vite** for bundling
- **Tailwind CSS** for styling
- **PDF.js** for in-browser PDF text extraction
- **IndexedDB** (via `idb`) for local document storage

---

## Local development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## Deploy to Cloudflare Pages (free)

### First time

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create pdf-summarizer --public --source=. --push
   ```

2. **Connect to Cloudflare Pages**
   - Log in at [dash.cloudflare.com](https://dash.cloudflare.com)
   - Go to **Workers & Pages → Create → Pages → Connect to Git**
   - Select your repository
   - Set build settings:
     - **Framework preset:** Vite
     - **Build command:** `npm run build`
     - **Build output directory:** `dist`
   - Click **Save and Deploy**

3. Cloudflare will assign a free `.pages.dev` URL automatically.

### Subsequent deploys

Push to your `main` branch — Cloudflare Pages deploys automatically.

```bash
git add .
git commit -m "Update"
git push
```

### Manual deploy (no git)

```bash
npm install -g wrangler
npm run build
wrangler pages deploy dist --project-name=pdf-summarizer
```

---

## How it works

| Step | What happens |
|------|-------------|
| Upload | PDF is read into memory — never sent to a server |
| Extract | PDF.js extracts raw text page by page in the browser |
| Detect | Heading patterns identify chapter boundaries; falls back to page chunks |
| Summarize | TF-weighted sentence scoring selects the most significant sentences |
| Store | Document metadata and PDF data saved to IndexedDB in your browser |

---

## Limitations

- **Scanned PDFs** (image-only) produce no text — use a PDF with selectable text
- **Very long PDFs** (200+ pages) may take 10–30 seconds to process
- Data is stored per browser — clearing site data removes your library
- Chapter detection works best with documents that use explicit "Chapter N" headings or numbered sections

---

## Project structure

```
src/
├── components/
│   ├── ChapterNav.tsx       Chapter sidebar navigation
│   ├── ChapterReader.tsx    Tabbed reading interface
│   ├── DocumentCard.tsx     Library card
│   ├── ProgressBar.tsx      Processing progress
│   └── Sidebar.tsx          App sidebar
├── hooks/
│   └── useDocuments.ts      Document list state
├── lib/
│   ├── chapterDetector.ts   Heading-pattern chapter detection
│   ├── db.ts                IndexedDB persistence
│   ├── pdfExtractor.ts      PDF.js wrapper
│   ├── processor.ts         Main orchestration pipeline
│   ├── summarizer.ts        TF scoring, key concepts, questions
│   └── uuid.ts              UUID generator
├── pages/
│   ├── DocumentView.tsx     /doc/:id
│   ├── Library.tsx          /
│   └── Upload.tsx           /upload
├── types/
│   └── index.ts             Shared TypeScript types
├── App.tsx
├── index.css
└── main.tsx
```

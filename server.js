// Editable portfolio backend: Node.js + Express + Multer
// This starter backend stores certificate metadata in data/certificates.json
// and uploaded files in uploads/. Run with: npm install && npm start

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const UPLOAD_DIR = path.join(ROOT, "uploads");
const DATA_FILE = path.join(DATA_DIR, "certificates.json");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(ROOT, "public")));
app.use("/uploads", express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safeName = file.originalname
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-120);
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Only JPG, PNG, WEBP, and PDF files are allowed."));
  }
});

function readCertificates() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}
function writeCertificates(items) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), "utf8");
}
function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Public list endpoint: GET /api/certificates?search=html&category=DICT
app.get("/api/certificates", (req, res) => {
  const search = String(req.query.search || "").trim().toLowerCase();
  const category = String(req.query.category || "all");
  let items = readCertificates();

  if (category !== "all") {
    items = items.filter(item => item.category === category);
  }
  if (search) {
    items = items.filter(item =>
      [item.title, item.category, item.description, ...(item.keywords || [])]
        .join(" ").toLowerCase().includes(search)
    );
  }
  res.json({ count: items.length, certificates: items });
});

// Add a certificate with an uploaded image/PDF.
// POST /api/certificates multipart/form-data fields:
// title, category, description, keywords (comma-separated), file
app.post("/api/certificates", upload.single("file"), (req, res) => {
  const title = String(req.body.title || "").trim();
  const category = String(req.body.category || "").trim();
  const allowedCategories = [
    "TESDA", "DICT", "FreeCodeCamp", "Cisco Network Academy", "International"
  ];

  if (!title || !allowedCategories.includes(category)) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({
      error: "A title and a valid certificate category are required."
    });
  }

  const certificate = {
    id: makeId(),
    title,
    category,
    description: String(req.body.description || "").trim(),
    keywords: String(req.body.keywords || "")
      .split(",").map(s => s.trim()).filter(Boolean),
    fileUrl: req.file ? `/uploads/${req.file.filename}` : "",
    fileType: req.file ? req.file.mimetype : "",
    createdAt: new Date().toISOString()
  };

  const items = readCertificates();
  items.unshift(certificate);
  writeCertificates(items);
  res.status(201).json({ message: "Certificate added.", certificate });
});

// Edit a certificate's information.
// PUT /api/certificates/:id with JSON { title, category, description, keywords }
app.put("/api/certificates/:id", (req, res) => {
  const items = readCertificates();
  const index = items.findIndex(item => item.id === req.params.id);
  if (index < 0) return res.status(404).json({ error: "Certificate not found." });

  const allowedCategories = [
    "TESDA", "DICT", "FreeCodeCamp", "Cisco Network Academy", "International"
  ];
  const current = items[index];
  const title = req.body.title === undefined ? current.title : String(req.body.title).trim();
  const category = req.body.category === undefined ? current.category : String(req.body.category).trim();

  if (!title || !allowedCategories.includes(category)) {
    return res.status(400).json({ error: "A title and a valid category are required." });
  }

  items[index] = {
    ...current,
    title,
    category,
    description: req.body.description === undefined
      ? current.description : String(req.body.description).trim(),
    keywords: req.body.keywords === undefined
      ? current.keywords
      : (Array.isArray(req.body.keywords)
          ? req.body.keywords
          : String(req.body.keywords).split(","))
          .map(s => String(s).trim()).filter(Boolean)
  };

  writeCertificates(items);
  res.json({ message: "Certificate updated.", certificate: items[index] });
});

// Delete a certificate record and its uploaded file.
// DELETE /api/certificates/:id
app.delete("/api/certificates/:id", (req, res) => {
  const items = readCertificates();
  const item = items.find(certificate => certificate.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Certificate not found." });

  if (item.fileUrl) {
    const filePath = path.join(ROOT, item.fileUrl.replace(/^\/+/, ""));
    if (filePath.startsWith(UPLOAD_DIR) && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  writeCertificates(items.filter(certificate => certificate.id !== req.params.id));
  res.json({ message: "Certificate deleted." });
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  res.status(400).json({ error: err.message || "Something went wrong." });
});

// Vercel imports this Express app as a serverless function.
// The local listener is used only when running `npm start` on your computer.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Portfolio website running at http://localhost:${PORT}`);
  });
}

module.exports = app;

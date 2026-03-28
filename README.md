# DataCleanX — FLUX-Based AI Data Cleaning Pipeline

> Transform noisy, messy raw text into high-quality AI training data using the **FLUX line-level cleaning methodology** — with a beautiful React dashboard to visualise every step.

[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev)
[![Flask](https://img.shields.io/badge/Flask-3.0-black?logo=flask)](https://flask.palletsprojects.com)
[![Tests](https://img.shields.io/badge/tests-60%20passing-brightgreen)](#running-the-tests)
[![License](https://img.shields.io/badge/license-MIT-green)](#license)

---

## Table of Contents

- [What is DataCleanX?](#what-is-datacleanx)
- [Why is this useful?](#why-is-this-useful)
- [Live Demo](#live-demo)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running Locally](#running-locally)
- [How It Works — The FLUX Method](#how-it-works--the-flux-method)
- [Pipeline Steps](#pipeline-steps)
- [Running the Tests](#running-the-tests)
- [Deploying to Render](#deploying-to-render)
- [Contributing](#contributing)
- [Getting Help](#getting-help)
- [Who Maintains This](#who-maintains-this)
- [License](#license)

---

## What is DataCleanX?

**DataCleanX** is a full-stack web application that cleans raw text files — web scrapes, forum posts, HTML articles, research papers — into high-quality sentences ready for AI/ML training. It is inspired by the [FLUX data curation research paper](FLUX%20Data%20Worth%20Training.pdf).

Upload your `.txt` files, tune the quality threshold, and get back:

- A cleaned JSON dataset of high-quality sentences
- A full stats report with interactive charts
- A data quality grade and score

```
Raw .txt Files → Clean → Filter → Deduplicate → Quality Score → Download JSON
```

---

## Why is this useful?

Training a language model on noisy data leads to a noisy model. The biggest challenge in real-world data pipelines is that traditional tools delete entire documents the moment they find a single bad line — wasting 60–80% of potentially good data.

**DataCleanX solves this with FLUX line-level filtering:**

| Approach | Strategy | Data Loss |
|---|---|---|
| Traditional | 1 bad line → delete entire document | 60–80% |
| FLUX (DataCleanX) | 1 bad line → delete only that line | 20–30% |

This means you keep more good content while still removing HTML tags, spam, duplicate sentences, URLs, emails, encoding errors, and low-quality noise.

---

## Live Demo

> https://datacleanx.onrender.com

Demo Video
![App Demo](./assets/demo.gif)


---

## Features

- **Drag-and-drop file upload** — upload multiple `.txt` files at once
- **Configurable pipeline** — adjust quality threshold (0.2–0.9) and minimum words per line
- **Interactive results dashboard** with:
  - Data quality grade (A / B / C / D)
  - Pipeline funnel chart (Raw → Dedup → Final)
  - Noise vs. Retained pie chart
  - Quality score distribution histogram (colour-coded 0–1)
  - Token count before/after comparison
- **Download** `cleaned_data.json` and `stats.json` directly from the browser
- **Sample guide** explaining what file types work and what FLUX removes
- **60 automated tests** (unit, integration, end-to-end)

---

## Project Structure

```
datacleanx/
├── backend/
│   ├── app.py               ← Flask API (/api/clean, /api/health) + serves React SPA
│   └── requirements.txt     ← Flask, flask-cors
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── types.ts
│   │   └── components/
│   │       ├── Navbar.tsx
│   │       ├── HeroSection.tsx
│   │       ├── UploadSection.tsx
│   │       ├── SampleGuide.tsx
│   │       └── ResultsDashboard.tsx
│   ├── package.json
│   └── vite.config.ts       ← Dev proxy: /api → http://127.0.0.1:5000
│
├── tests/
│   ├── test_utils.py        ← 27 unit tests
│   ├── test_pipeline.py     ← 13 integration tests
│   └── test_api.py          ← 20 end-to-end API tests
│
├── data/                    ← Sample raw .txt files
├── output/                  ← Pipeline output (auto-created, git-ignored)
├── utils.py                 ← Core: clean_text, is_good_line, deduplicate, quality_score
├── pipeline.py              ← CLI pipeline runner
├── requirements.txt         ← Root deps (includes gunicorn for production)
├── render.yaml              ← One-click Render deployment config
└── README.md
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Python | 3.9 or higher |
| Node.js | 18 or higher |
| npm | 9 or higher |

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/rajeshkadiyalaaa/datacleanx.git
cd datacleanx
```

**2. Install Python dependencies**

```bash
pip install -r backend/requirements.txt
```

**3. Install and build the frontend**

```bash
cd frontend
npm install
cd ..
```

### Running Locally

You need two terminals running at the same time.

**Terminal 1 — Flask backend**

```bash
cd backend
python3 app.py
# Running on http://127.0.0.1:5000
```

**Terminal 2 — Vite dev server**

```bash
cd frontend
npm run dev
# Running on http://localhost:3000
```

Then open **[http://localhost:3000](http://localhost:3000)** in your browser.

> **macOS note:** macOS Monterey and later run AirPlay Receiver on port 5000 over IPv6. The Vite proxy is already configured to use `http://127.0.0.1:5000` (explicit IPv4) to avoid this conflict.

### Using the CLI (no frontend needed)

You can also run the pipeline directly from the command line:

```bash
# Drop your .txt files into data/
python3 pipeline.py

# Custom options
python3 pipeline.py --threshold 0.65 --min-words 3
python3 pipeline.py --data-dir my_docs/ --output-dir results/
```

Results are saved to `output/cleaned_data.json` and `output/stats.json`.

---

## How It Works — The FLUX Method

The core innovation is **line-level filtering** instead of document-level filtering.

**Before (document-level — old approach):**
```
"Climate change is a pressing global issue."     ← KEEP
"BUY NOW!!! LIMITED OFFER $$$"                  ← BAD LINE
"Scientists predict further warming by 2100."    ← KEEP
→ Entire document deleted because of 1 bad line
```

**After (line-level — FLUX approach):**
```
"Climate change is a pressing global issue."     ← KEEP ✓
"BUY NOW!!! LIMITED OFFER $$$"                  ← removed ✗
"Scientists predict further warming by 2100."    ← KEEP ✓
→ Only the bad line is removed, good content is preserved
```

### Quality Scoring

Each sentence is scored from `0.0` to `~0.80` using five features:

| Feature | Weight | What it measures |
|---|---|---|
| Length score | 0.25 | Optimal sentence length (target: 30 words) |
| Stopword ratio | 0.25 | Natural language indicator (function words) |
| Lexical diversity | 0.25 | Unique words / total words |
| Repetition penalty | −0.20 | Redundant word fraction |
| Avg word length | 0.05 | Longer words → richer content |

Only sentences scoring **≥ threshold** (default `0.50`) are kept.

---

## Pipeline Steps

| Step | What it does |
|---|---|
| 1. Load | Read all `.txt` files from the input directory |
| 2. Clean | Strip HTML, URLs, emails, non-ASCII, special characters, normalise case |
| 3. Filter | Remove lines with < 5 words, high digit/symbol ratio, or spam repetition |
| 4. Line-level clean | Join only the good lines (FLUX innovation — preserves good content) |
| 5. Deduplicate | SHA-256 hash-based exact duplicate removal |
| 6. Quality score | Score each sentence 0–0.8, keep those ≥ threshold |
| 7. Token count | Estimate token savings (before vs after) |
| 8. Save | Write `cleaned_data.json` + `stats.json` |

---

## Running the Tests

The test suite has 60 tests across three files:

```bash
python3 -m unittest tests.test_utils tests.test_pipeline tests.test_api -v
```

| File | Coverage | Tests |
|---|---|---|
| `tests/test_utils.py` | Unit — every function in `utils.py` | 27 |
| `tests/test_pipeline.py` | Integration — full pipeline flow | 13 |
| `tests/test_api.py` | End-to-end — all Flask API routes | 20 |

**Expected output:**
```
Ran 60 tests in 0.02s
OK
```

---

## Deploying to Render

The repository includes a `render.yaml` that configures everything automatically.

**Steps:**

1. Fork or push this repo to your GitHub account
2. Go to [render.com](https://render.com) and sign in
3. Click **New → Web Service**
4. Connect your GitHub repository
5. Render reads `render.yaml` automatically — no manual configuration needed
6. Click **Create Web Service**

**Build command** (runs automatically):
```bash
pip install -r requirements.txt && cd frontend && npm install && npm run build
```

**Start command** (runs automatically):
```bash
gunicorn --chdir backend app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120
```

Your app will be live at `https://your-service-name.onrender.com` within ~3 minutes.

> **Free tier note:** Render's free plan spins down after 15 minutes of inactivity. The first request after sleep takes ~30 seconds to wake up.

---

## Contributing

Contributions are welcome! Here is how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and add tests if applicable
4. Run the test suite to make sure everything passes: `python3 -m unittest tests.test_utils tests.test_pipeline tests.test_api`
5. Commit your changes: `git commit -m "Add your feature"`
6. Push to your fork and open a Pull Request

Please keep pull requests focused — one feature or bug fix per PR.

### Areas where contributions are especially welcome

- Additional heuristic filters for `is_good_line`
- Support for input formats beyond `.txt` (`.pdf`, `.docx`, `.csv`)
- Near-duplicate detection using MinHash or SimHash
- Language detection to filter non-English content
- Frontend improvements (dark/light mode toggle, mobile layout)

---

## Getting Help

If you run into a problem or have a question:

- **Bug reports / feature requests** — [open a GitHub Issue](https://github.com/rajeshkadiyalaaa/datacleanx/issues)
- **Questions about the FLUX paper** — see the included [FLUX Data Worth Training.pdf](FLUX%20Data%20Worth%20Training.pdf)
- **General discussion** — use [GitHub Discussions](https://github.com/rajeshkadiyalaaa/datacleanx/discussions)

When reporting a bug, please include:
- Your Python and Node.js versions (`python3 --version`, `node --version`)
- The exact error message or unexpected behaviour
- A minimal example `.txt` file that reproduces the issue (if applicable)

---

## Who Maintains This

This project is built and maintained by **[Rajesh Kadiyala](https://github.com/rajeshkadiyalaaa)**.

Inspired by the FLUX data curation research: *"FLUX: Fast Software Updates by Updating Just the Right Files."*

---

## License

This project is licensed under the **MIT License** — you are free to use, modify, and distribute it.

See [LICENSE](LICENSE) for full details.

---

*DataCleanX — because the quality of your model is only as good as the quality of your data.*

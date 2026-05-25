# Lumina Video Downloader

A modern premium video downloader built with React, Flask, and yt-dlp.

## Features

- Modern glassmorphism UI
- High-quality video & audio downloads
- Multiple resolution support
- Fast metadata extraction
- Real-time download progress
- Responsive design
- Local processing for better privacy

---

## Tech Stack

### Frontend
- React
- Vite
- CSS3

### Backend
- Flask
- yt-dlp
- FFmpeg

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/Himanshu478140/Lumina_Video.git
cd Lumina_Video
```

---

### 2. Backend Setup

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt
```

---

### 3. Frontend Setup

```bash
cd frontend

npm install
```

---

## Running the Project

### Option 1 — One Click (Windows)

Simply run:

```bash
run.bat
```

---

### Option 2 — Manual Start

#### Start Backend

```bash
cd backend
venv\Scripts\activate
python app.py
```

#### Start Frontend

```bash
cd frontend
npm run dev
```

---

## Usage

1. Open:

```text
http://localhost:5173
```

2. Paste a video URL
3. Select format & resolution
4. Download your video

---

## Requirements

- Python 3.10+
- Node.js 18+
- FFmpeg installed and added to PATH

---

## Disclaimer

This project is intended for educational and personal use only. Users are responsible for complying with the terms of service of the platforms they access.

---

## License

MIT License
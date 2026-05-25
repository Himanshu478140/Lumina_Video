import os
import sys
import subprocess
import urllib.request
import zipfile
import shutil

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
FFMPEG_DIR = os.path.join(ROOT_DIR, 'backend', 'ffmpeg')
FFMPEG_EXE = os.path.join(FFMPEG_DIR, 'ffmpeg.exe')

def download_ffmpeg():
    if os.path.exists(FFMPEG_EXE):
        print("✅ FFmpeg already found.")
        return
        
    print("⏳ Downloading FFmpeg...")
    os.makedirs(FFMPEG_DIR, exist_ok=True)
    
    # We download a minimal static build of ffmpeg for Windows
    url = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
    zip_path = os.path.join(FFMPEG_DIR, "ffmpeg.zip")
    
    try:
        urllib.request.urlretrieve(url, zip_path)
        print("⏳ Extracting FFmpeg...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Find the ffmpeg.exe inside the zip (it's inside a nested bin/ directory)
            for file_info in zip_ref.infolist():
                if file_info.filename.endswith('ffmpeg.exe'):
                    file_info.filename = 'ffmpeg.exe' # flatten the path
                    zip_ref.extract(file_info, FFMPEG_DIR)
                    break
                    
        os.remove(zip_path)
        print("✅ FFmpeg downloaded and extracted.")
    except Exception as e:
        print(f"❌ Failed to download FFmpeg automatically: {e}")
        print(f"Please manually download ffmpeg.exe and place it in: {FFMPEG_DIR}")
        sys.exit(1)

def build_frontend():
    print("⏳ Building React frontend...")
    frontend_dir = os.path.join(ROOT_DIR, 'frontend')
    # Run npm install and npm run build
    subprocess.run(["npm", "install"], cwd=frontend_dir, shell=True, check=True)
    subprocess.run(["npm", "run", "build"], cwd=frontend_dir, shell=True, check=True)
    print("✅ Frontend built successfully.")

def build_executable():
    print("⏳ Running PyInstaller...")
    # Install PyInstaller and PyWebView
    subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller", "pywebview"], check=True)
    # Install all backend requirements so PyInstaller can bundle them!
    req_file = os.path.join(ROOT_DIR, 'backend', 'requirements.txt')
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", req_file], check=True)
    
    subprocess.run([sys.executable, "-m", "PyInstaller", "backend.spec", "--clean", "-y"], cwd=ROOT_DIR, check=True)
    print("✅ Executable generated in the 'dist' folder.")

if __name__ == "__main__":
    print("=== Starting Lumina Video Desktop Build ===")
    download_ffmpeg()
    build_frontend()
    build_executable()
    print("=== Build Complete! ===")
    print(r"You can find your app in: dist\LuminaVideo.exe")

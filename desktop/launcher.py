import os
import sys
import threading
import time
import webview

# Add the backend directory to sys.path for local development
if not getattr(sys, 'frozen', False):
    sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend'))

from app import app

def start_flask():
    # Run flask in production mode (debug=False, use_reloader=False)
    # Port 5000 is used by default, could be dynamic in the future if needed
    app.run(port=5000, debug=False, use_reloader=False)

if __name__ == '__main__':
    # Start Flask server in a daemon thread so it dies when the UI dies
    t = threading.Thread(target=start_flask)
    t.daemon = True
    t.start()

    # Give Flask a second to spin up
    time.sleep(1.5)

    # Add a timestamp to bypass aggressive Edge WebView2 caching
    url = f'http://127.0.0.1:5000/?t={int(time.time())}'
    
    # Launch the native PyWebView window
    webview.create_window('Lumina Video Downloader', url, width=1024, height=768)
    webview.start()

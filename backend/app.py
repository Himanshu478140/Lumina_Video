from flask import Flask, request, jsonify, send_file, after_this_request
from flask_cors import CORS
import yt_dlp
import os
import logging

app = Flask(__name__)
CORS(app)

from yt_dlp.networking.impersonate import ImpersonateTarget

from yt_dlp.networking.impersonate import ImpersonateTarget

# Configure logging
logging.basicConfig(filename='backend_debug.log', level=logging.DEBUG, 
                    format='%(asctime)s %(levelname)s: %(message)s')

# Global dictionary to store download progress
download_progress = {}

def progress_hook(d):
    """
    Hook to capture yt-dlp progress and store it in the global dictionary.
    Expencts 'info_dict' to have a 'download_id' field injected manually if possible,
    OR we rely on a filename match? 
    Assumes we can create a closure or partial to pass the download_id.
    """
    if d['status'] == 'downloading':
        p_id = d.get('info_dict', {}).get('download_id')
        # If we can't inject into info_dict easily, we will use a closure in the route
        pass

@app.route('/api/progress/<download_id>', methods=['GET'])
def get_progress(download_id):
    return jsonify(download_progress.get(download_id, {'status': 'unknown', 'percent': 0}))

@app.route('/api/info', methods=['POST'])
def get_info():
    data = request.get_json()
    url = data.get('url')
    proxy = data.get('proxy')
    cookies_browser = data.get('cookies_browser')
    cookie_content = data.get('cookie_content')
    
    if not url:
        return jsonify({"error": "No URL provided"}), 400

    try:
        # FFMPEG is available at C:/ffmpeg/bin/ffmpeg.exe
        ydl_opts = {
            'quiet': True, 
            'no_warnings': True,
            'ffmpeg_location': 'C:/ffmpeg/bin/ffmpeg.exe',
            # Network and Anti-Blocking Options
            'socket_timeout': 30,
            # 'source_address': '0.0.0.0', # Force IPv4 - disabled unless needed
            'nocheckcertificate': True,
            'impersonate': ImpersonateTarget(client='chrome'), # Uses curl-cffi to mimic browser TLS
        }
        
        if proxy and proxy.strip():
            ydl_opts['proxy'] = proxy.strip()
            
        if cookie_content and cookie_content.strip():
            # Write cookies to a temp file
            cookie_file = os.path.join(os.getcwd(), 'temp_cookies.txt')
            with open(cookie_file, 'w', encoding='utf-8') as f:
                f.write(cookie_content)
            ydl_opts['cookiefile'] = cookie_file
        elif cookies_browser and cookies_browser.strip() and cookies_browser != 'none':
            ydl_opts['cookiesfrombrowser'] = (cookies_browser, )
            
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # DEBUG LOGGING TO FILE
            raw_formats = info.get('formats', [])
            logging.debug(f"Found {len(raw_formats)} raw formats for {url}")

            processed_formats = {}

            for f in raw_formats:
                # Video codec check
                if f.get('vcodec') == 'none':
                    continue
                
                height = f.get('height')
                if not height:
                    continue
                
                # With FFMPEG, we can merge video+audio, so we treat all video formats as valid.
                # Just find the best "container/codec" for each height.
                
                current_best = processed_formats.get(height)
                is_mp4 = f['ext'] == 'mp4'
                
                if current_best:
                    current_is_mp4 = current_best['ext'] == 'mp4'
                    # Prefer MP4 over others
                    if is_mp4 and not current_is_mp4:
                        processed_formats[height] = f
                        continue
                    # If same extension, maybe check bitrate/fps?
                    # For now, simple overwrite (yt-dlp usually provides better ones later in list)
                    processed_formats[height] = f
                else:
                    processed_formats[height] = f
            
            logging.debug(f"Selected formats: {list(processed_formats.keys())}")

            # Convert back to list and sort by height descending
            sorted_resolutions = sorted(processed_formats.keys(), reverse=True)
            
            final_formats = []
            for h in sorted_resolutions:
                f = processed_formats[h]
                # Determine if it needs merging (no acodec)
                needs_merge = f.get('acodec') == 'none'
                
                final_formats.append({
                    'format_id': f['format_id'],
                    'ext': f['ext'],
                    'resolution': f"{f.get('width')}x{f.get('height')}",
                    'height': f['height'],
                    'filesize': f.get('filesize'),
                    'note': f.get('format_note', ''),
                    'needs_merge': needs_merge
                })
            
            return jsonify({
                "title": info.get('title'),
                "thumbnail": info.get('thumbnail'),
                "duration": info.get('duration'),
                "webpage_url": info.get('webpage_url'),
                "formats": final_formats
            })
    except Exception as e:
        logging.error("Error in get_info", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/download', methods=['POST'])
def download_video():
    data = request.get_json()
    url = data.get('url')
    format_id = data.get('format_id')
    proxy = data.get('proxy')
    cookies_browser = data.get('cookies_browser')
    cookie_content = data.get('cookie_content')
    download_id = data.get('download_id') # New ID from frontend
    
    if not url:
        return jsonify({"error": "No URL provided"}), 400

    downloads_dir = os.path.join(os.getcwd(), 'downloads')
    if not os.path.exists(downloads_dir):
        os.makedirs(downloads_dir)

    # Progress Hook Closure
    def update_progress(d):
        if not download_id:
            return
            
        if d['status'] == 'downloading':
            # Remove ANSI colors using regex
            import re
            ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
            
            def clean_str(s):
                return ansi_escape.sub('', str(s)).strip()
            
            # Extract fields
            percent_str = clean_str(d.get('_percent_str', '0%'))
            speed_str = clean_str(d.get('_speed_str', 'N/A'))
            eta_str = clean_str(d.get('_eta_str', 'N/A'))
            total_bytes_str = clean_str(d.get('_total_bytes_str', 'N/A'))
            
            # Fallback for total bytes if not in string format
            if total_bytes_str == 'N/A' and d.get('total_bytes'):
                total_bytes_str = f"{d.get('total_bytes') / (1024*1024):.2f} MiB"
            elif total_bytes_str == 'N/A' and d.get('total_bytes_estimate'):
                total_bytes_str = f"~{d.get('total_bytes_estimate') / (1024*1024):.2f} MiB"

            # Clean percent string to float
            try:
                percent = float(percent_str.replace('%', ''))
            except:
                percent = 0
            
            # Log to file/console so it's not silent
            if int(percent) % 10 == 0: # Log every 10%
                logging.info(f"Download {download_id}: {percent}% | {speed_str} | {eta_str}")

            download_progress[download_id] = {
                'status': 'downloading',
                'percent': percent,
                'speed': speed_str,
                'eta': eta_str,
                'size': total_bytes_str,
                'filename': d.get('filename')
            }
        elif d['status'] == 'finished':
            logging.info(f"Download {download_id}: Finished downloading, merging...")
            download_progress[download_id] = {
                'status': 'merging',
                'percent': 100,
                'speed': '-',
                'eta': 'Processing...',
                'size': 'Calculating...'
            }

    try:
        # Define output template
        ydl_opts = {
            'outtmpl': os.path.join(downloads_dir, '%(title)s.%(ext)s'),
            'quiet': True,
            'ffmpeg_location': 'C:/ffmpeg/bin/ffmpeg.exe',
            # Network/Anti-Blocking
            'socket_timeout': 60, 
            # 'source_address': '0.0.0.0', 
            'nocheckcertificate': True,
            'impersonate': ImpersonateTarget(client='chrome'), # Modern fix for SSL EOF
            'progress_hooks': [update_progress], # Attach hook
            
            # Speed Optimizations
            'concurrent_fragment_downloads': 5, # Download 5 segments at once
            'http_chunk_size': 10485760, # 10MB chunks (reduces overhead)
        }
        
        if proxy and proxy.strip():
            ydl_opts['proxy'] = proxy.strip()
            
        if cookie_content and cookie_content.strip():
            # Write cookies to a temp file
            cookie_file = os.path.join(os.getcwd(), 'temp_cookies.txt')
            with open(cookie_file, 'w', encoding='utf-8') as f:
                f.write(cookie_content)
            ydl_opts['cookiefile'] = cookie_file
        elif cookies_browser and cookies_browser.strip() and cookies_browser != 'none':
            ydl_opts['cookiesfrombrowser'] = (cookies_browser, )
        
        if format_id:
            # If we select a specific format, we want that video quality.
            # If it has no audio, we want to match it with best audio.
            # yt-dlp syntax for this is "format_id+bestaudio"
            # Actually, standard is "format_id+bestaudio/best"
            
            # Let's try to download video+bestaudio if possible.
            ydl_opts['format'] = f"{format_id}+bestaudio/best"
            
            # Force MP4 format for compatibility
            ydl_opts['merge_output_format'] = 'mp4'

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            logging.debug(f"Starting download for {url} with ID {download_id}")
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            
            # Since we forced merge to mp4, filename logic is simple:
            # yt-dlp usually updates the filename extension automatically in info,
            # but prepare_filename might depend on the initial template.
            # We verify what's on disk.
            base, _ = os.path.splitext(filename)
            final_filename = f"{base}.mp4"
            
            if not os.path.exists(final_filename):
                 # Fallback check
                 if os.path.exists(filename):
                     final_filename = filename

            download_progress[download_id] = {'status': 'completed', 'percent': 100}
            
            # Cleanup File After Request
            @after_this_request
            def remove_file(response):
                try:
                    if os.path.exists(final_filename):
                        os.remove(final_filename)
                    if 'cookiefile' in ydl_opts and os.path.exists(ydl_opts['cookiefile']):
                        os.remove(ydl_opts['cookiefile'])
                except Exception as e:
                    logging.error(f"Error removing file: {e}")
                return response
                
            return send_file(final_filename, as_attachment=True)
    except Exception as e:
        logging.error("Error in download", exc_info=True)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

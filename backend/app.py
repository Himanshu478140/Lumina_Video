from flask import Flask, request, jsonify, send_file, after_this_request
from flask_cors import CORS
import yt_dlp
import os
import re
import time
import tempfile
import logging
import threading

app = Flask(__name__)
CORS(app)

logging.basicConfig(filename='backend_debug.log', level=logging.DEBUG,
                    format='%(asctime)s %(levelname)s: %(message)s')

def detect_platform(url):
    url_lower = url.lower()
    if 'youtube.com' in url_lower or 'youtu.be' in url_lower:
        return {'name': 'youtube', 'display': 'YouTube', 'is_experimental': False}
    elif 'instagram.com' in url_lower:
        return {'name': 'instagram', 'display': 'Instagram', 'is_experimental': False}
    elif 'tiktok.com' in url_lower:
        return {'name': 'tiktok', 'display': 'TikTok', 'is_experimental': False}
    elif 'facebook.com' in url_lower or 'fb.watch' in url_lower:
        return {'name': 'facebook', 'display': 'Facebook', 'is_experimental': False}
    elif 'pinterest.' in url_lower:
        return {'name': 'pinterest', 'display': 'Pinterest', 'is_experimental': True}
    return {'name': 'other', 'display': 'Unknown', 'is_experimental': False}

download_progress = {}

cancelled_downloads = set()
cancelled_downloads_lock = threading.Lock()

class DownloadCancelled(Exception):
    pass

def parse_yt_dlp_error(error_exc):
    error_msg = str(error_exc)
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    error_msg = ansi_escape.sub('', error_msg)

    if 'Sign in to confirm your age' in error_msg:
        return 'Age-restricted video. Please provide cookies to download.'
    elif 'Video unavailable' in error_msg or 'Private video' in error_msg:
        return 'Video is private or unavailable.'
    elif 'requested format not available' in error_msg:
        return 'The requested quality is not available for this video.'
    elif 'Geo-blocked' in error_msg or 'unavailable in your country' in error_msg:
        return 'This video is geo-blocked. Try using a Proxy URL.'
    elif 'Join this channel to get access' in error_msg or 'Members only' in error_msg:
        return 'This is a Members-only video. You must provide cookies from an account with an active membership to this channel.'
    elif 'HTTP Error 429' in error_msg:
        return 'Rate limited by platform (HTTP 429). Please try again later or use a proxy.'
    elif 'No video formats found' in error_msg:
        return 'No playable video formats found. The video might be broken, premium-only, or require you to be logged in.'

    clean_msg = re.sub(r'ERROR:\s*\[.*?\]\s*', '', error_msg).strip()
    return clean_msg or "An unknown download error occurred."

def cleanup_stale_temp_dirs():
    temp_root = tempfile.gettempdir()
    cutoff_time = time.time() - (24 * 3600)
    deleted_count = 0
    try:
        for entry in os.listdir(temp_root):
            if entry.startswith('lumina_downloads_'):
                dir_path = os.path.join(temp_root, entry)
                if os.path.isdir(dir_path):
                    if os.stat(dir_path).st_mtime < cutoff_time:
                        import shutil
                        shutil.rmtree(dir_path, ignore_errors=True)
                        deleted_count += 1
        if deleted_count > 0:
            logging.info(f"Cleaned up {deleted_count} stale temp directories.")
    except Exception as e:
        logging.error(f"Failed to cleanup temp directories: {e}")

cleanup_stale_temp_dirs()

def sanitize_filename(name, max_length=200):
    if not name:
        return f"video_{int(time.time())}"
    name = re.sub(r'[\\/:*?"<>|]', '', name)
    name = re.sub(r'[^\x00-\x7F]+', '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    name = name[:max_length] if len(name) > max_length else name
    return name or f"video_{int(time.time())}"

def build_base_ydl_opts(proxy=None, cookies_browser=None, cookie_content=None, cookie_dir=None):
    """
    Build the shared yt-dlp options used by both /api/info and /api/download.
    Node.js is detected automatically from PATH — no js_runtimes dict needed.
    """
    opts = {
        'quiet': True,
        'no_warnings': True,
        'ffmpeg_location': 'C:/ffmpeg/bin/ffmpeg.exe',
        'socket_timeout': 30,
        'nocheckcertificate': True,
    }

    if proxy and proxy.strip():
        opts['proxy'] = proxy.strip()

    if cookie_content and cookie_content.strip():
        # Write to the provided directory, or cwd as fallback
        cookie_dir = cookie_dir or os.getcwd()
        cookie_file = os.path.join(cookie_dir, 'temp_cookies.txt')
        with open(cookie_file, 'w', encoding='utf-8') as f:
            f.write(cookie_content)
        opts['cookiefile'] = cookie_file
    elif cookies_browser and cookies_browser.strip() and cookies_browser != 'none':
        opts['cookiesfrombrowser'] = (cookies_browser,)

    return opts


@app.route('/api/cancel/<download_id>', methods=['POST'])
def cancel_download(download_id):
    with cancelled_downloads_lock:
        cancelled_downloads.add(download_id)
    return jsonify({"success": True})

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

    platform_info = detect_platform(url)

    try:
        ydl_opts = build_base_ydl_opts(proxy, cookies_browser, cookie_content)

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            raw_formats = info.get('formats', [])
            logging.debug(f"Found {len(raw_formats)} raw formats for {url}")

            final_formats = []

            for f in raw_formats:
                # Skip storyboards
                if f.get('ext') == 'mhtml':
                    continue

                # Skip audio-only streams
                if f.get('vcodec') == 'none':
                    continue

                # Skip formats with no height (rare but happens)
                if not f.get('height') and not f.get('resolution'):
                    continue

                final_formats.append({
                    'format_id': f.get('format_id'),
                    'ext':        f.get('ext'),
                    'resolution': f.get('resolution'),
                    'height':     f.get('height'),
                    'width':      f.get('width'),
                    'fps':        f.get('fps'),
                    'vcodec':     f.get('vcodec'),
                    'filesize':   f.get('filesize') or f.get('filesize_approx'),
                    # True when there is no audio track — download needs a merge
                    'needs_merge': f.get('acodec') in ('none', 'unknown'),
                })

            # Sort: highest resolution first, then highest fps
            final_formats.sort(
                key=lambda x: (x.get('height') or 0, x.get('fps') or 0),
                reverse=True
            )

            is_hd = any((f.get('height') or 0) >= 720 for f in final_formats)

            return jsonify({
                "title":       info.get('title'),
                "thumbnail":   info.get('thumbnail'),
                "duration":    info.get('duration'),
                "webpage_url": info.get('webpage_url'),
                "formats":     final_formats,
                "platform":    platform_info,
                "is_hd":       is_hd,
            })

    except Exception as e:
        logging.error("Error in get_info", exc_info=True)
        return jsonify({"error": parse_yt_dlp_error(e)}), 500


@app.route('/api/download', methods=['POST'])
def download_video():
    data = request.get_json()
    url           = data.get('url')
    format_id     = data.get('format_id')       # the format_id chosen by the user
    height        = data.get('height')           # ← NEW: also send height from frontend
    output_format = data.get('output_format', 'video')
    proxy         = data.get('proxy')
    cookies_browser = data.get('cookies_browser')
    cookie_content  = data.get('cookie_content')
    download_id     = data.get('download_id')

    if not url:
        return jsonify({"error": "No URL provided"}), 400

    downloads_dir = tempfile.mkdtemp(prefix='lumina_downloads_')
    ansi_escape   = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')

    def clean_str(s):
        return ansi_escape.sub('', str(s)).strip()

    def update_progress(d):
        if not download_id:
            return
        with cancelled_downloads_lock:
            if download_id in cancelled_downloads:
                raise DownloadCancelled("User cancelled download.")

        if d['status'] == 'downloading':
            percent_str      = clean_str(d.get('_percent_str', '0%'))
            speed_str        = clean_str(d.get('_speed_str', 'N/A'))
            eta_str          = clean_str(d.get('_eta_str', 'N/A'))
            total_bytes_str  = clean_str(d.get('_total_bytes_str', 'N/A'))

            if total_bytes_str == 'N/A' and d.get('total_bytes'):
                total_bytes_str = f"{d['total_bytes'] / (1024*1024):.2f} MiB"
            elif total_bytes_str == 'N/A' and d.get('total_bytes_estimate'):
                total_bytes_str = f"~{d['total_bytes_estimate'] / (1024*1024):.2f} MiB"

            try:
                percent = float(percent_str.replace('%', ''))
            except:
                percent = 0

            if int(percent) % 10 == 0:
                logging.info(f"Download {download_id}: {percent}% | {speed_str} | {eta_str}")

            download_progress[download_id] = {
                'status': 'downloading',
                'stage':  'downloading',
                'percent': percent,
                'speed':   speed_str,
                'eta':     eta_str,
                'size':    total_bytes_str,
            }

        elif d['status'] == 'finished':
            stage     = 'converting' if output_format == 'audio' else 'merging'
            stage_msg = 'Converting to MP3...' if output_format == 'audio' else 'Merging audio & video...'
            logging.info(f"Download {download_id}: {stage_msg}")
            download_progress[download_id] = {
                'status': 'processing',
                'stage':   stage,
                'percent': 100,
                'speed':   '-',
                'eta':     stage_msg,
                'size':    '',
            }

    try:
        ydl_opts = build_base_ydl_opts(proxy, cookies_browser, cookie_content, cookie_dir=downloads_dir)
        ydl_opts.update({
            'outtmpl':                      os.path.join(downloads_dir, '%(title)s.%(ext)s'),
            'socket_timeout':               60,
            'progress_hooks':               [update_progress],
            'concurrent_fragment_downloads': 5,
            'http_chunk_size':              10485760,
            'restrictfilenames':            False,
            'windowsfilenames':             True,
        })

        # ── Format selection ──────────────────────────────────────────────────
        # We prefer height-based selection because YouTube format IDs can change
        # between the /api/info call and the actual download (different sessions).
        # Fallback chain: exact height → any height ≤ target → best available.
        if output_format == 'audio':
            ydl_opts['format'] = 'bestaudio/best'
            ydl_opts['postprocessors'] = [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '128',
            }]

        elif format_id == 'best' or not format_id:
            # User picked "Best quality" — just grab the highest available
            ydl_opts['format'] = 'bestvideo+bestaudio/best'
            ydl_opts['merge_output_format'] = 'mp4'

        elif height:
            # ✅ PRIMARY path — use height, not format_id, for stability
            h = int(height)
            ydl_opts['format'] = (
                f'bestvideo[height={h}]+bestaudio/'   # exact height + audio
                f'bestvideo[height={h}]/'
                f'bestvideo[height<={h}]+bestaudio/'  # closest lower height + audio
                f'bestvideo[height<={h}]/'
                f'bestvideo+bestaudio/best'            # full fallback
            )
            ydl_opts['merge_output_format'] = 'mp4'
            logging.debug(f"Downloading by height={h} (format_id hint: {format_id})")

        else:
            # Fallback: format_id was sent but no height — try ID then fall back gracefully
            ydl_opts['format'] = (
                f'{format_id}+bestaudio/'
                f'{format_id}/'
                'bestvideo+bestaudio/best'
            )
            ydl_opts['merge_output_format'] = 'mp4'
            logging.debug(f"Downloading by format_id={format_id} (no height provided)")

        # ─────────────────────────────────────────────────────────────────────

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            logging.debug(f"Starting download: url={url} id={download_id} format={output_format} height={height}")
            info = ydl.extract_info(url, download=True)

            raw_filename = ydl.prepare_filename(info)
            base, _      = os.path.splitext(raw_filename)
            safe_title   = sanitize_filename(info.get('title', 'video'))

            if output_format == 'audio':
                final_filename  = f"{base}.mp3"
                attachment_name = f"{safe_title}.mp3"
            else:
                final_filename  = f"{base}.mp4"
                attachment_name = f"{safe_title}.mp4"

            # Fallback file search if expected path doesn't exist
            if not os.path.exists(final_filename):
                if os.path.exists(raw_filename):
                    final_filename = raw_filename
                else:
                    files       = os.listdir(downloads_dir)
                    media_files = [f for f in files if not f.endswith('.txt')]
                    if media_files:
                        final_filename = os.path.join(downloads_dir, media_files[0])
                    else:
                        raise FileNotFoundError("Downloaded file not found on disk")

            download_progress[download_id] = {
                'status': 'completed',
                'stage':  'completed',
                'percent': 100,
            }

            @after_this_request
            def remove_file(response):
                try:
                    import shutil
                    shutil.rmtree(downloads_dir, ignore_errors=True)
                except Exception as e:
                    logging.error(f"Error removing temp dir: {e}")
                return response

            return send_file(final_filename, as_attachment=True, download_name=attachment_name)

    except DownloadCancelled:
        import shutil
        shutil.rmtree(downloads_dir, ignore_errors=True)
        with cancelled_downloads_lock:
            cancelled_downloads.discard(download_id)
        logging.info(f"Download {download_id} cancelled by user.")
        return jsonify({"error": "Download cancelled by user."}), 400

    except Exception as e:
        import shutil
        shutil.rmtree(downloads_dir, ignore_errors=True)
        logging.error("Error in download", exc_info=True)
        return jsonify({"error": parse_yt_dlp_error(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
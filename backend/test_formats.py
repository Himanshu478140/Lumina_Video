import yt_dlp
import json
import traceback

ydl_opts = {
    'quiet': True, 
    'no_warnings': True,
    'nocheckcertificate': True,
    'cookiesfrombrowser': ('chrome',),
}

out_path = r"c:\WEBSITE\VIDEO DOWNLOADER\backend\out_debug3.txt"

try:
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info("https://youtu.be/rWCKBwXK2dY", download=False)
        raw_formats = info.get('formats', [])
        
        results = []
        for f in raw_formats:
            results.append({
                'format_id': f.get('format_id'),
                'ext': f.get('ext'),
                'vcodec': f.get('vcodec'),
                'acodec': f.get('acodec'),
                'height': f.get('height'),
                'width': f.get('width'),
                'resolution': f.get('resolution')
            })

        with open(out_path, 'w') as out:
            json.dump({
                "count": len(raw_formats),
                "formats": results
            }, out, indent=2)

except Exception as e:
    with open(out_path, 'w') as out:
        out.write(traceback.format_exc())

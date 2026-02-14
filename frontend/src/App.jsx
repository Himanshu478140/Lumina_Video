import React, { useState } from 'react';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null); // { percent, speed, eta, status }
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [proxy, setProxy] = useState('');
  const [cookiesBrowser, setCookiesBrowser] = useState('none');
  const [cookieContent, setCookieContent] = useState('');

  const fetchInfo = async () => {
    // ... existing fetchInfo ...
    if (!url) return;
    setLoading(true);
    setError('');
    setVideoInfo(null);
    try {
      const response = await fetch('http://localhost:5000/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, proxy, cookies_browser: cookiesBrowser, cookie_content: cookieContent }),
      });
      const data = await response.json();
      if (response.ok) {
        setVideoInfo(data);
      } else {
        setError(data.error || 'Failed to fetch video info');
      }
    } catch (err) {
      setError('Failed to connect to backend. Make sure it is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (formatId, fileName) => {
    setDownloading(true);
    setDownloadProgress({ percent: 0, speed: '0 KiB/s', eta: '--:--', status: 'starting' });

    const downloadId = Math.random().toString(36).substring(7); // Simple unique ID

    // Polling Interval
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/progress/${downloadId}`);
        if (res.ok) {
          const data = await res.json();
          setDownloadProgress(data);
          if (data.status === 'completed' || data.status === 'error') {
            clearInterval(pollInterval);
          }
        }
      } catch (e) {
        console.error("Poll error", e);
      }
    }, 1000);

    try {
      const response = await fetch('http://localhost:5000/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          format_id: formatId,
          proxy,
          cookies_browser: cookiesBrowser,
          cookie_content: cookieContent,
          download_id: downloadId
        }),
      });

      clearInterval(pollInterval); // Stop polling when request finishes

      if (response.ok) {
        setDownloadProgress({ percent: 100, speed: 'Done', eta: '0s', status: 'completed' }); // Force complete UI
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName || 'video.mp4';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        // Clear progress after short delay
        setTimeout(() => {
          setDownloading(false);
          setDownloadProgress(null);
        }, 2000);
      } else {
        const data = await response.json();
        alert('Download failed: ' + (data.error || 'Unknown error'));
        setDownloading(false);
      }
    } catch (err) {
      clearInterval(pollInterval);
      alert('Download error: ' + err.message);
      setDownloading(false);
    }
  };

  return (
    <div>
      <h1>Lumina Video</h1>
      <p className="subtitle">Download videos from anywhere in premium quality.</p>

      <div className="card">
        {/* ... INPUT GROUP REMAINING UNCHANGED ... */}
        <div className="input-group">
          <input
            type="text"
            placeholder="Paste video URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchInfo()}
          />
          <button onClick={fetchInfo} disabled={loading}>
            {loading ? <span className="loader"></span> : 'Go'}
          </button>
        </div>

        {/* ... ADVANCED SETTINGS REMAINING UNCHANGED ... */}
        {/* Advanced Settings Toggle */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              padding: '0.5rem',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: 'none',
              transform: 'none'
            }}
          >
            {showAdvanced ? '▼' : '▶'} Advanced Settings (Proxy & Cookies)
          </button>

          {showAdvanced && (
            <div style={{ marginTop: '0.5rem', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.5rem' }}>Proxy URL (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., http://user:pass@1.2.3.4:8080"
                  value={proxy}
                  onChange={(e) => setProxy(e.target.value)}
                  style={{ width: '100%', fontSize: '0.9rem', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '0.5rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.5rem' }}>Method 1: Authentication Source</label>
                <select
                  value={cookiesBrowser}
                  onChange={(e) => setCookiesBrowser(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)',
                    color: 'white',
                    fontFamily: 'inherit'
                  }}
                >
                  <option value="none">None (Default)</option>
                  <option value="chrome">Use Chrome Cookies</option>
                  <option value="edge">Use Edge Cookies</option>
                  <option value="firefox">Use Firefox Cookies</option>
                </select>
                <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.3rem' }}>
                  ⚠️ Close browser first if using this.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.5rem' }}>Method 2: Paste Cookies.txt (No Browser Close Needed)</label>
                <textarea
                  placeholder="Paste Netscape format cookies here..."
                  value={cookieContent}
                  onChange={(e) => setCookieContent(e.target.value)}
                  style={{
                    width: '100%',
                    height: '80px',
                    padding: '0.8rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)',
                    color: 'white',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.3rem' }}>
                  Use "Get cookies.txt LOCALLY" extension to copy cookies.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ERROR DISPLAY */}
        {error && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</div>}

        {/* DOWNLOAD PROGRESS BAR */}
        {downloading && downloadProgress && (
          <div style={{ margin: '1.5rem 0', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>{downloadProgress.status === 'merging' ? 'Processing Video...' : 'Downloading...'}</span>
              <span>{Math.round(downloadProgress.percent)}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${downloadProgress.percent}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #a855f7)', transition: 'width 0.3s ease' }}></div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem', color: '#aaa' }}>
              <span>Speed: {downloadProgress.speed}</span>
              <span>ETA: {downloadProgress.eta}</span>
            </div>
          </div>
        )}

        {videoInfo && !downloading && (
          <div className="video-preview">
            <div className="thumbnail-container">
              <img src={videoInfo.thumbnail} alt={videoInfo.title} className="thumbnail-img" />
            </div>
            <div className="video-info">
              <h3 className="video-title">{videoInfo.title}</h3>
              <div className="video-meta">
                <span>{videoInfo.duration}s</span>
                <span>{videoInfo.formats.length} Formats</span>
              </div>

              <h4>Download Options</h4>
              <div className="download-options">
                {videoInfo.formats.map((fmt) => (
                  <button
                    key={fmt.format_id}
                    className="format-btn"
                    onClick={() => handleDownload(fmt.format_id, `${videoInfo.title}.${fmt.ext}`)}
                  >
                    {fmt.height}p ({fmt.ext})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

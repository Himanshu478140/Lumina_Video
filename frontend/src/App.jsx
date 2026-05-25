import React, { useState, useEffect, useRef } from 'react';
import { AuroraText } from './AuroraText';
import { Particles } from './Particles';

/* ===== SVG ICONS ===== */
const Icons = {
  // Feature icons
  Bolt: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Film: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  ),
  Globe: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Shield: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  Music: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
    </svg>
  ),

  // Platform icons
  YouTube: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  TikTok: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.3 0 .59.04.86.11V9.03a6.27 6.27 0 0 0-.86-.06 6.27 6.27 0 0 0-6.27 6.27 6.27 6.27 0 0 0 6.27 6.27 6.27 6.27 0 0 0 6.27-6.27V8.78a8.18 8.18 0 0 0 3.83.96V6.37a4.82 4.82 0 0 1-3.77.32z" />
    </svg>
  ),
  Instagram: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  ),
  Pinterest: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345l-.288 1.178c-.046.19-.152.232-.349.141-1.303-.604-2.118-2.502-2.118-4.032 0-3.284 2.388-6.302 6.89-6.302 3.619 0 6.428 2.576 6.428 6.012 0 3.599-2.268 6.495-5.421 6.495-1.057 0-2.052-.55-2.392-1.202l-.65 2.476c-.236.898-.876 2.023-1.307 2.709 1.228.379 2.531.583 3.876.583 6.621 0 11.988-5.367 11.988-11.987C24 5.367 18.638 0 12.017 0z" />
    </svg>
  ),
  Facebook: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),

  // UI icons
  Link: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  Download: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  ArrowDown: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  ),
};

/* ===== DATA ===== */
const features = [
  { icon: Icons.Bolt, title: 'Lightning Fast', desc: 'Powered by optimized download engines for maximum speed on any connection.' },
  { icon: Icons.Film, title: 'HD & 4K Quality', desc: 'Download in the highest available resolution — up to 4K HDR when supported.' },
  { icon: Icons.Globe, title: 'Multiple Platforms', desc: 'Seamlessly download content from major video and social platforms.' },
  { icon: Icons.Shield, title: 'Secure & Private', desc: 'No data stored, no tracking. Your downloads stay completely private.' },
  { icon: Icons.Music, title: 'Audio Extraction', desc: 'Extract audio tracks in MP3, AAC, or FLAC format from any video source.' },
  { icon: Icons.Sparkles, title: 'No Watermark', desc: 'Download original content exactly as published — clean, no watermarks added.' },
];

const platforms = [
  { icon: Icons.YouTube, name: 'YouTube' },
  { icon: Icons.TikTok, name: 'TikTok' },
  { icon: Icons.Instagram, name: 'Instagram' },
  { icon: Icons.Pinterest, name: 'Pinterest' },
  { icon: Icons.Facebook, name: 'Facebook' },
];

const faqs = [
  { q: 'Is Lumina Video free to use?', a: 'Yes, Lumina Video is completely free. There are no hidden fees, subscriptions, or premium tiers. All features are available to every user.' },
  { q: 'Which websites are supported?', a: 'We’re continuously improving platform compatibility and currently support many of the web’s most popular video platforms.' },
  { q: 'Is it safe to download videos?', a: 'Absolutely. We process everything locally on your machine. No data is stored on external servers, and we don\'t track your downloads or browsing activity.' },
  { q: 'Can I download audio only?', a: 'Yes! You can extract audio in various formats including MP3 and AAC. Simply look for audio-only options in the format selection after fetching video info.' },
  { q: 'What quality options are available?', a: 'We offer all available quality options from the source — from standard 360p/480p up to Full HD 1080p, 2K, and 4K when available from the original content.' },
  { q: 'Why is only a single format available?', a: 'This can occasionally happen during format detection. Refresh the page and paste the link again to fetch all available formats.' },
];

/* ===== INTERSECTION OBSERVER HOOK ===== */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return ref;
}

/* ===== STAGGER REVEAL COMPONENT ===== */
function RevealStagger({ children, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return <div className={`reveal-stagger ${className}`} ref={ref}>{children}</div>;
}

/* ===== FAQ ITEM COMPONENT ===== */
function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button className="faq-question" onClick={() => setOpen(!open)}>
        {question}
        <span className={`faq-chevron ${open ? 'open' : ''}`}><Icons.ArrowDown /></span>
      </button>
      <div className={`faq-answer ${open ? 'open' : ''}`}>
        <div className="faq-answer-inner">{answer}</div>
      </div>
    </div>
  );
}

/* ===== MAIN APP ===== */
function App() {
  // Downloader state
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentDownloadId, setCurrentDownloadId] = useState(null);
  const [showMoreFormats, setShowMoreFormats] = useState(false);
  const [proxy, setProxy] = useState('');
  const [cookiesBrowser, setCookiesBrowser] = useState('none');
  const [cookieContent, setCookieContent] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [activeModal, setActiveModal] = useState(null); // 'privacy' | 'terms' | null
  const isNavClicking = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    if (activeModal) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeModal]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isNavClicking.current) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -80% 0px' }
    );

    const sections = ['features', 'platforms', 'faq'];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  // Format duration from seconds to m:ss
  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Lightweight platform hint based on URL typing
  const detectPlatformHint = (u) => {
    if (!u) return null;
    const lower = u.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return { name: 'youtube', display: 'YouTube' };
    if (lower.includes('instagram.com')) return { name: 'instagram', display: 'Instagram' };
    if (lower.includes('tiktok.com')) return { name: 'tiktok', display: 'TikTok' };
    if (lower.includes('facebook.com') || lower.includes('fb.watch')) return { name: 'facebook', display: 'Facebook' };
    if (lower.includes('pinterest.')) return { name: 'pinterest', display: 'Pinterest', experimental: true };
    return { name: 'other', display: 'Unknown' };
  };

  const platformHint = detectPlatformHint(url);

  // Reveal refs
  const featuresRef = useReveal();
  const platformsRef = useReveal();
  const statsRef = useReveal();
  const faqRef = useReveal();

  const fetchInfo = async () => {
    if (!url) return;
    setLoading(true);
    setError('');
    setVideoInfo(null);
    setShowMoreFormats(false);
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

  const handleCancel = async () => {
    if (!currentDownloadId || isCancelling) return;
    setIsCancelling(true);
    try {
      await fetch(`http://localhost:5000/api/cancel/${currentDownloadId}`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Cancel failed', err);
      setIsCancelling(false);
    }
  };

  const handleDownload = async (formatId, outputFormat = 'video') => {
    if (downloading) return;
    setIsCancelling(false);
    setDownloading(true);
    setDownloadProgress({ percent: 0, speed: '—', eta: '—', stage: 'starting', status: 'starting' });
    const downloadId = Math.random().toString(36).substring(7);
    setCurrentDownloadId(downloadId);

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
        console.error('Poll error', e);
      }
    }, 1000);

    try {
      const response = await fetch('http://localhost:5000/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          format_id: formatId,

          output_format: outputFormat,
          proxy,
          cookies_browser: cookiesBrowser,
          cookie_content: cookieContent,
          download_id: downloadId,
        }),
      });

      clearInterval(pollInterval);

      if (response.ok) {
        setDownloadProgress({ percent: 100, speed: 'Done', eta: '0s', stage: 'completed', status: 'completed' });
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        const ext = outputFormat === 'audio' ? 'mp3' : 'mp4';
        a.download = (videoInfo?.title || 'video') + '.' + ext;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        setTimeout(() => {
          setDownloading(false);
          setDownloadProgress(null);
          setCurrentDownloadId(null);
          setIsCancelling(false);
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error === "Download cancelled by user." ? 'Download cancelled.' : 'Download failed: ' + (data.error || 'Unknown error'));
        setDownloading(false);
        setDownloadProgress(null);
        setCurrentDownloadId(null);
        setIsCancelling(false);
      }
    } catch (err) {
      clearInterval(pollInterval);
      setError(isCancelling ? 'Download cancelled.' : 'Download error: ' + err.message);
      setDownloading(false);
      setDownloadProgress(null);
      setCurrentDownloadId(null);
      setIsCancelling(false);
    }
  };

  const scrollToHero = () => {
    document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToSection = (e, id) => {
    e.preventDefault();
    setActiveSection(id);
    isNavClicking.current = true;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

    // Re-enable scroll spy after scroll animation finishes
    setTimeout(() => {
      isNavClicking.current = false;
    }, 1000);
  };

  return (
    <>
      {/* ===== NAVIGATION ===== */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`} id="nav">
        <a href="#hero" className="nav-brand" onClick={(e) => { e.preventDefault(); scrollToHero(); }}>
          <span className="nav-brand-logo">
            <img src="/image.png" alt="Lumina Video Logo" onError={(e) => e.target.style.display = 'none'} />
          </span>
          <span className="nav-brand-text">Lumina Video</span>
        </a>

        <ul className="nav-center">
          <li><a href="#features" className={activeSection === 'features' ? 'active' : ''} onClick={(e) => scrollToSection(e, 'features')}>Features</a></li>
          <li><a href="#platforms" className={activeSection === 'platforms' ? 'active' : ''} onClick={(e) => scrollToSection(e, 'platforms')}>Platforms</a></li>
          <li><a href="#faq" className={activeSection === 'faq' ? 'active' : ''} onClick={(e) => scrollToSection(e, 'faq')}>FAQ</a></li>
        </ul>

        <a
          href="https://github.com/Himanshu478140/Lumina_Video/releases/download/v1.0.0/LuminaVideo_Setup.exe"
          className="nav-cta"
          download
        >
          <Icons.Download /> Download App
        </a>
      </nav>

      {/* ===== HERO ===== */}
      <section className="hero" id="hero">
        <Particles className="particles-background" quantity={15} color="#5b5bd6" />
        <h1>
          Video <AuroraText>Downloader</AuroraText><br />
        </h1>

        <p className="hero-subtitle">
          Paste a link. Get the video. Fast, private, no account needed.
        </p>

        {/* Downloader Card */}
        <div className="w-full max-w-[620px]" style={{ margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <a
              href="https://github.com/Himanshu478140/Lumina_Video/releases/download/v1.0.0/LuminaVideo_Setup.exe"
              className="btn-primary"
              style={{ display: 'inline-flex', padding: '1.2rem 2.5rem', fontSize: '1.2rem', textDecoration: 'none', justifyContent: 'center', boxShadow: '0 8px 24px rgba(91, 91, 214, 0.25)' }}
              download
            >
              <Icons.Download /> Download for Windows (v1.0.0)
            </a>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="features-section" id="features">
        <div className="section">
          <div className="section-header reveal" ref={featuresRef}>
            <div className="section-label">Features</div>
            <h2 className="section-title">Everything You Need,<br />Nothing You Don't</h2>
            <p className="section-subtitle">
              Built with performance and simplicity in mind. No bloat, no ads, just a powerful tool that works.
            </p>
          </div>

          <RevealStagger className="features-grid">
            {features.map((f, i) => (
              <div className="feature-card" key={i}>
                <div className="feature-icon">
                  <f.icon />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* ===== PLATFORMS ===== */}
      <section className="section" id="platforms">
        <div className="section-header reveal" ref={platformsRef}>
          <div className="section-label">Platforms</div>
          <h2 className="section-title">Works With Your<br />Favorite Platforms</h2>
          <p className="section-subtitle">
            Support for all major video platforms and hundreds more.
          </p>
        </div>

        <RevealStagger className="platforms-grid">
          {platforms.map((p, i) => (
            <div className="platform-card" key={i}>
              <div className="platform-icon">
                <p.icon />
              </div>
              <span>{p.name}</span>
            </div>
          ))}
        </RevealStagger>
      </section>

      {/* ===== STATS ===== */}
      <div className="stats-section" id="stats">
        <RevealStagger className="stats-row" ref={statsRef}>
          <div className="stat-item">
            <h3>Multi-Platform</h3>
            <p>Supported Sites</p>
          </div>
          <div className="stat-item">
            <h3>4K</h3>
            <p>Max Resolution</p>
          </div>
          <div className="stat-item">
            <h3>100%</h3>
            <p>Free Forever</p>
          </div>
          <div className="stat-item">
            <h3>0</h3>
            <p>Data Collected</p>
          </div>
        </RevealStagger>
      </div>

      {/* ===== FAQ ===== */}
      <section className="section" id="faq">
        <div className="section-header reveal" ref={faqRef}>
          <div className="section-label">FAQ</div>
          <h2 className="section-title">Frequently Asked<br />Questions</h2>
        </div>

        <div className="faq-list">
          {faqs.map((f, i) => (
            <FaqItem key={i} question={f.q} answer={f.a} />
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta-section">
        <h2>Ready to Download?</h2>
        <p>Paste any video URL and start downloading in seconds.</p>
        <button className="cta-btn" onClick={scrollToHero}>
          Try It Now <Icons.ArrowRight />
        </button>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <a href="#hero" className="nav-brand" onClick={(e) => { e.preventDefault(); scrollToHero(); }}>
              <span className="nav-brand-logo">
                <img src="/image.png" alt="Lumina Video Logo" onError={(e) => e.target.style.display = 'none'} />
              </span>
              <span className="nav-brand-text">Lumina Video</span>
            </a>
            <p>A free, open-source video downloader built for speed, quality, and privacy.</p>
          </div>

          <div className="footer-links-group">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#platforms">Platforms</a>
            <a href="#faq">FAQ</a>
          </div>

          <div className="footer-links-group">
            <h4>Legal</h4>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveModal('privacy'); }}>Privacy Policy</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveModal('terms'); }}>Terms of Service</a>
          </div>

          <div className="footer-links-group">
            <h4>Connect</h4>
            <a href="https://github.com/Himanshu478140/Lumina_Video.git" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Lumina Video. All rights reserved.</span>
          <span>Crafted by Himanshu</span>
        </div>
      </footer>

      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveModal(null)} aria-label="Close modal">
              &times;
            </button>
            {activeModal === 'privacy' && (
              <>
                <h3>Privacy Policy</h3>
                <div className="modal-body">
                  <p><strong>Effective Date: May 24, 2026</strong></p>
                  <p>At Lumina Video, your privacy comes first. This Privacy Policy explains how we handle, protect, and respect your information.</p>

                  <h4>1. No Data Collection</h4>
                  <p>We do not collect, log, or store any personal information, IP addresses, downloading history, or URLs entered on our service. All operations are strictly transient and private.</p>

                  <h4>2. Cookies & Local Storage</h4>
                  <p>Lumina Video may use local storage for essential site functionality. No tracking cookies or third-party analytics are used.</p>

                  <h4>3. Third-Party Platforms</h4>
                  <p>When you request a download, our system fetches media streams from the requested third-party platform (such as YouTube, TikTok, Pinterest, etc.). Your interaction with those platform streams is governed by their respective privacy policies.</p>

                  <h4>4. Security</h4>
                  <p>All connections to Lumina Video are secured using standard HTTPS encryption.</p>
                </div>
              </>
            )}
            {activeModal === 'terms' && (
              <>
                <h3>Terms of Service</h3>
                <div className="modal-body">
                  <p><strong>Effective Date: May 24, 2026</strong></p>
                  <p>By using Lumina Video, you agree to these Terms of Service.</p>

                  <h4>1. Fair & Personal Use Only</h4>
                  <p>Lumina Video is designed solely for personal, informational, educational, and non-commercial purposes. You may not use this service to violate copyright laws or intellectual property rights.</p>

                  <h4>2. User Responsibility</h4>
                  <p>You assume sole legal responsibility for any content you download. You must ensure you have the explicit permission of the copyright owner, or that the media is in the public domain, before initiating a download.</p>

                  <h4>3. Service Availability</h4>
                  <p>Lumina Video is provided as available without guarantees of uninterrupted service, platform compatibility, or download speeds.</p>

                  <h4>4. Liability Limitation</h4>
                  <p>In no event shall Lumina Video or its open-source contributors be liable for any direct, indirect, or incidental damages arising out of the use or inability to use this service.</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default App;

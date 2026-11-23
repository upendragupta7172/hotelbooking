import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { ArrowLeft, ArrowRight, Play, X } from 'lucide-react';
import './GalleryModal.css';

function getVideoEmbed(url) {
  try {
    const u = new URL(url);
    // YouTube
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      let videoId = u.searchParams.get('v');
      if (!videoId && u.hostname === 'youtu.be') videoId = u.pathname.slice(1);
      if (!videoId && u.pathname.includes('/embed/')) videoId = u.pathname.split('/embed/')[1];
      if (videoId) return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` };
    }
    // Vimeo
    if (u.hostname.includes('vimeo.com')) {
      const match = u.pathname.match(/\/(\d+)/);
      const videoId = match?.[1];
      if (videoId) return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=0` };
    }
  } catch {}
  return { type: 'direct', embedUrl: url };
}

function GalleryModal({ title, images = [], videos = [], initialTab = 'photos', initialIndex = 0, onClose }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const closeButtonRef = useRef(null);
  const media = useMemo(() => activeTab === 'photos' ? images : videos, [activeTab, images, videos]);
  const activeMedia = media[activeIndex];
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (media.length > 1 && event.key === 'ArrowRight') setActiveIndex((index) => (index + 1) % media.length);
      if (media.length > 1 && event.key === 'ArrowLeft') setActiveIndex((index) => (index - 1 + media.length) % media.length);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [media.length]);

  const changeTab = (tab) => {
    setActiveTab(tab);
    setActiveIndex(0);
  };
  const step = (direction) => setActiveIndex((index) => (index + direction + media.length) % media.length);

  return ReactDOM.createPortal(
    <div className="property-gallery-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="property-gallery-modal" role="dialog" aria-modal="true" aria-labelledby="property-gallery-title">
        <header className="property-gallery-header">
          <div>
            <h2 id="property-gallery-title">{title}</h2>
            <p>{activeMedia ? `${activeIndex + 1} of ${media.length} ${activeTab}` : `No ${activeTab} available`}</p>
          </div>
          <button ref={closeButtonRef} className="property-gallery-close" type="button" onClick={onClose} aria-label="Close gallery"><X size={21} /></button>
        </header>

        <div className="property-gallery-tabs" role="tablist" aria-label="Property media">
          <button type="button" role="tab" aria-selected={activeTab === 'photos'} onClick={() => changeTab('photos')}>Photos <span>{images.length}</span></button>
          <button type="button" role="tab" aria-selected={activeTab === 'videos'} onClick={() => changeTab('videos')}>Videos <span>{videos.length}</span></button>
        </div>

        <div className="property-gallery-stage">
          {activeMedia && activeTab === 'photos' && <img className="property-gallery-media" src={activeMedia} alt={`${title} photo ${activeIndex + 1}`} />}
          {activeMedia && activeTab === 'videos' && (() => {
            const videoInfo = getVideoEmbed(activeMedia);
            return videoInfo.type !== 'direct'
              ? <iframe key={activeMedia} className="property-gallery-media property-gallery-iframe" src={videoInfo.embedUrl} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={`${title} video ${activeIndex + 1}`} />
              : <video key={activeMedia} className="property-gallery-media" src={activeMedia} controls playsInline preload="metadata" />;
          })()}
          {!activeMedia && <p className="property-gallery-empty">No {activeTab} have been added for this property yet.</p>}
          {media.length > 1 && <button className="property-gallery-nav property-gallery-prev" type="button" aria-label={`Previous ${activeTab.slice(0, -1)}`} onClick={() => step(-1)}><ArrowLeft size={22} /></button>}
          {media.length > 1 && <button className="property-gallery-nav property-gallery-next" type="button" aria-label={`Next ${activeTab.slice(0, -1)}`} onClick={() => step(1)}><ArrowRight size={22} /></button>}
        </div>

        {media.length > 1 && <div className="property-gallery-thumbnails" aria-label={`${activeTab} thumbnails`}>
          {media.map((url, index) => {
            const videoInfo = activeTab === 'videos' ? getVideoEmbed(url) : null;
            return (
              <button key={`${url}-${index}`} type="button" className={index === activeIndex ? 'is-active' : ''} aria-label={`Show ${activeTab.slice(0, -1)} ${index + 1}`} aria-current={index === activeIndex ? 'true' : undefined} onClick={() => setActiveIndex(index)}>
                {activeTab === 'photos'
                  ? <img src={url} alt="" />
                  : <span>
                      <Play size={18} fill="currentColor" />
                      {videoInfo && videoInfo.type === 'youtube' && <small style={{ display: 'block', fontSize: '9px', marginTop: '2px', opacity: .8 }}>YouTube</small>}
                      {videoInfo && videoInfo.type === 'vimeo' && <small style={{ display: 'block', fontSize: '9px', marginTop: '2px', opacity: .8 }}>Vimeo</small>}
                    </span>
                }
              </button>
            );
          })}
        </div>}
      </section>
    </div>,
    document.body
  );
}

export default GalleryModal;

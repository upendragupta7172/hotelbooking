import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const SiteLayout = ({ children }) => {
  const { pathname } = useLocation();
  const isAdminDashboard = pathname === '/admin';

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      return undefined;
    }

    const targets = document.querySelectorAll('main > *:not(.hero-section), main article, .site-footer');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('motion-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });

    targets.forEach((target) => {
      target.classList.add('motion-reveal');

      if (target.tagName === 'ARTICLE') {
        const siblings = Array.from(target.parentElement.children).filter((element) => element.tagName === 'ARTICLE');
        const index = siblings.indexOf(target);
        target.style.setProperty('--motion-delay', `${Math.min(index, 4) * 70}ms`);
      }

      observer.observe(target);
    });

    return () => {
      observer.disconnect();
      targets.forEach((target) => {
        target.classList.remove('motion-reveal', 'motion-visible');
        target.style.removeProperty('--motion-delay');
      });
    };
  }, [pathname]);

  return (
    <>
      <Navbar />
      {children}
      {!isAdminDashboard && <Footer />}
    </>
  );
};

export default SiteLayout;

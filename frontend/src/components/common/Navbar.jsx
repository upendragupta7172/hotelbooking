import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ArrowUpRight, BedDouble, ChevronDown, Menu, Utensils, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/', label: 'Home' },
  { to: '/hotels', label: 'Hotels' },
  { to: '/about', label: 'About us' },
  { to: '/contact', label: 'Contact' },
];

const exploreItems = [
  { to: '/rooms', label: 'Rooms & Suites', icon: BedDouble, desc: 'All available rooms across properties' },
  { to: '/dining', label: 'Dining & Room Service', icon: Utensils, desc: 'Full menu from our kitchens' },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const exploreRef = useRef(null);

  const closeMenu = () => {
    setMenuOpen(false);
    setExploreOpen(false);
  };

  useEffect(() => {
    if (!exploreOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (exploreRef.current && !exploreRef.current.contains(event.target)) {
        setExploreOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setExploreOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [exploreOpen]);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="StayNest home" onClick={closeMenu}>
          <span className="brand-name">StayNest<span>®</span><small>DISCOVER COMFORT. EXPERIENCE LUXURY.</small></span>
        </Link>

        <nav className={`main-nav ${menuOpen ? 'main-nav-open' : ''}`} aria-label="Main navigation">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={closeMenu}>
              {link.label}
            </NavLink>
          ))}

          {/* Explore Dropdown (Click only) */}
          <div className="explore-nav-item" ref={exploreRef}>
            <button
              type="button"
              className="explore-nav-trigger"
              aria-expanded={exploreOpen}
              aria-haspopup="true"
              onClick={() => setExploreOpen((prev) => !prev)}
            >
              Explore <ChevronDown size={13} className={`explore-chevron${exploreOpen ? ' explore-chevron-open' : ''}`} />
            </button>

            {exploreOpen && (
              <div className="explore-dropdown" role="menu">
                {exploreItems.map(({ to, label, icon: Icon, desc }) => (
                  <Link
                    key={to}
                    to={to}
                    className="explore-dropdown-item"
                    role="menuitem"
                    onClick={closeMenu}
                  >
                    <span className="explore-dropdown-icon"><Icon size={16} /></span>
                    <span>
                      <strong>{label}</strong>
                      <small>{desc}</small>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Mobile auth link */}
          {isAuthenticated && user?.role === 'customer'
            ? <Link className="mobile-book-link" to="/dashboard" onClick={closeMenu}>My account</Link>
            : <Link className="mobile-book-link" to="/account/login" onClick={closeMenu}>Sign in</Link>}
        </nav>

        <div className="header-actions">
          {isAuthenticated && user?.role === 'admin'
            ? <Link className="booking-link" to="/admin">Admin <ArrowUpRight size={14} /></Link>
            : isAuthenticated
              ? <>
                  <Link className="booking-link" to="/dashboard">My account <ArrowUpRight size={14} /></Link>
                  <button className="booking-link account-logout" type="button" onClick={logout}>Sign out</button>
                </>
              : <Link className="booking-link" to="/account/login">Sign in <ArrowUpRight size={14} /></Link>}
          <Link className="header-cta" to="/hotels">Book a stay <ArrowUpRight size={15} /></Link>
        </div>

        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
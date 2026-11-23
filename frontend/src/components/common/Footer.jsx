// import React from 'react';
// import { ArrowUpRight, Camera, Mail, MapPin, Phone } from 'lucide-react';

// const currentYear = new Date().getFullYear();

// const Footer = () => (
//   <footer className="site-footer" id="contact">
//     <div className="footer-main">
//       <div className="footer-brand">
//         <a className="brand footer-logo" href="/" aria-label="StayNest home">
//           <span className="brand-name">StayNest<span>®</span><small>DISCOVER COMFORT. EXPERIENCE LUXURY.</small></span>
//         </a>
//         <p>Discover comfort. Experience luxury. Find a stay that feels made for the way you travel.</p>
//         <div className="footer-socials">
//         <a className="social-link" href="https://www.instagram.com/" aria-label="Instagram">
//           <Camera size={17} />
//         </a>
//         <a className="social-link" href="https://www.youtube.com/" aria-label="YouTube">
//           <ArrowUpRight size={17} />
//         </a>
//         </div>
//       </div>
//       <div className="footer-column">
//         <h3>EXPLORE</h3>
//         <a href="/hotels">Explore hotels</a>
//         <a href="/about">About StayNest</a>
//         <a href="/contact">Contact us</a>
//         <a href="/my-bookings">My bookings</a>
//       </div>
//       <div className="footer-column">
//         <h3>GET IN TOUCH</h3>
//         <a href="tel:+918679222309"><Phone size={15} /> +91 86792 22309</a>
//         <a href="mailto:hello@staynest.in"><Mail size={15} /> hello@staynest.in</a>
//         <span><MapPin size={15} /> Rishikesh, Uttarakhand, India</span>
//       </div>
//       <a className="back-top" href="#" aria-label="Back to top"><ArrowUpRight size={18} /></a>
//     </div>
//     <div className="footer-bottom">
//       <span>© {currentYear} StayNest. Made for meaningful stays.</span>
//       <span>RISHIKESH&nbsp; · &nbsp;INDIA</span>
//     </div>
//   </footer>
// );

// export default Footer;





import React from 'react';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaYoutube } from 'react-icons/fa';

const currentYear = new Date().getFullYear();

const Footer = () => (
  <footer className="site-footer" id="contact">
    <div className="footer-main">
      <div className="footer-brand">
        <a className="brand footer-logo" href="/" aria-label="StayNest home">
          <span className="brand-name">StayNest<span>®</span><small>DISCOVER COMFORT. EXPERIENCE LUXURY.</small></span>
        </a>
        <p>Discover comfort. Experience luxury. Find a stay that feels made for the way you travel.</p>
        <div className="footer-socials">
          <a className="social-link" href="https://www.instagram.com/" aria-label="Instagram" target="_blank" rel="noreferrer">
            <FaInstagram size={17} />
          </a>
          <a className="social-link" href="https://www.youtube.com/" aria-label="YouTube" target="_blank" rel="noreferrer">
            <FaYoutube size={17} />
          </a>
          <a className="social-link" href="https://www.facebook.com/" aria-label="Facebook" target="_blank" rel="noreferrer">
            <FaFacebookF size={17} />
          </a>
        </div>
      </div>
      <div className="footer-column">
        <h3>EXPLORE</h3>
        <a href="/hotels">Explore hotels</a>
        <a href="/about">About StayNest</a>
        <a href="/contact">Contact us</a>
        <a href="/my-bookings">My bookings</a>
      </div>
      <div className="footer-column">
        <h3>GET IN TOUCH</h3>
        <a href="tel:+918679222309"><Phone size={15} /> +91 86792 22309</a>
        <a href="mailto:hello@staynest.in"><Mail size={15} /> hello@staynest.in</a>
        <span><MapPin size={15} /> Rishikesh, Uttarakhand, India</span>
      </div>
      <a className="back-top" href="#" aria-label="Back to top"><ArrowUpRight size={18} /></a>
    </div>
    <div className="footer-bottom">
      <span>© {currentYear} StayNest. Made for meaningful stays.</span>
      <span>RISHIKESH&nbsp; · &nbsp;INDIA</span>
    </div>
  </footer>
);

export default Footer;
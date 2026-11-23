// import React, { useState } from 'react';
// import { ArrowRight, Clock3, ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
// import SiteLayout from '../components/common/SiteLayout';
// import './ContactPage.css';

// const contactLocation = 'Rishikesh, Uttarakhand, India';
// const mapQuery = encodeURIComponent(contactLocation);

// function ContactPage() {
//   const [submitted, setSubmitted] = useState(false);

//   const submitContact = (event) => {
//     event.preventDefault();
//     setSubmitted(true);
//     event.currentTarget.reset();
//   };

//   return (
//     <SiteLayout>
//       <main className="contact-page">
//         <div className="page-banner">
//           <div className="section-shell">
//             <p className="eyebrow">WE’RE HERE TO HELP</p>
//             <h1>Let’s make your<br /><em>next stay easy.</em></h1>
//             <p>Questions, a special request or just want to say hello? We’re listening.</p>
//           </div>
//         </div>
//         <div className="section-shell contact-layout">
//           <section className="contact-details">
//             <p className="eyebrow">GET IN TOUCH</p>
//             <h2>A real person<br /><em>is just a note away.</em></h2>
//             <p className="contact-lead">Our small guest team is happy to help with a booking, a room question or a little inspiration.</p>
//             <div className="contact-detail-item"><span><Phone size={17} /></span><div><small>CALL US</small><a href="tel:+918679222309">+91 86792 22309</a></div></div>
//             <div className="contact-detail-item"><span><Mail size={17} /></span><div><small>EMAIL US</small><a href="mailto:hello@staynest.in">hello@staynest.in</a></div></div>
//             <div className="contact-detail-item"><span><MapPin size={17} /></span><div><small>FIND US</small><p>{contactLocation}</p></div></div>
//             <div className="contact-detail-item"><span><Clock3 size={17} /></span><div><small>GUEST SUPPORT</small><p>Daily, 9:00 AM – 7:00 PM IST</p></div></div>
//           </section>
//           <section className="contact-form-panel">
//             <p className="eyebrow">SEND A NOTE</p>
//             <h2>How can we help?</h2>
//             {submitted && <p className="contact-success" role="status">Thanks for reaching out. Your demo message is ready for our guest team.</p>}
//             <form className="contact-form" onSubmit={submitContact}>
//               <label className="form-field">Your name<input name="name" autoComplete="name" required /></label>
//               <label className="form-field">Email address<input name="email" type="email" autoComplete="email" required /></label>
//               <label className="form-field">What’s on your mind?<select name="topic" defaultValue="Booking enquiry"><option>Booking enquiry</option><option>Room question</option><option>Special request</option><option>Something else</option></select></label>
//               <label className="form-field">Your message<textarea name="message" rows="4" required /></label>
//               <button className="button button-primary" type="submit">Send message <ArrowRight size={15} /></button>
//               <small>This demo form does not send personal information to a server.</small>
//             </form>
//           </section>
//         </div>
//         <section className="section-shell contact-map-section" aria-labelledby="contact-map-title">
//           <div className="contact-map-copy">
//             <p className="eyebrow">COME SAY HELLO</p>
//             <h2 id="contact-map-title">Find us in <em>Rishikesh.</em></h2>
//             <p>Our guest support team is based in Rishikesh, Uttarakhand. Open the map for directions and nearby landmarks.</p>
//             <a className="contact-map-link" href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noreferrer">Open in Google Maps <ExternalLink size={15} /></a>
//           </div>
//           <div className="contact-map-frame"><iframe title={`Map showing ${contactLocation}`} src={`https://maps.google.com/maps?q=${mapQuery}&z=12&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div>
//         </section>
//         <section className="contact-faq-section" aria-labelledby="contact-faq-title">
//           <div className="section-shell">
//             <div className="contact-faq-heading"><p className="eyebrow">A FEW HELPFUL ANSWERS</p><h2 id="contact-faq-title">Frequently asked <em>questions.</em></h2><p>Quick answers about making and managing your StayNest reservation.</p></div>
//             <div className="contact-faq-list">
//               <details><summary>How do I book a stay?<span aria-hidden="true">+</span></summary><p>Choose a property and room, enter your dates and guest details, then select prepaid online payment or pay at the hotel when that option is available.</p></details>
//               <details><summary>When is an online booking confirmed?<span aria-hidden="true">+</span></summary><p>After Razorpay verifies your payment, your reservation is sent to the hotel for review. You can check its Pending or Confirmed status in your account bookings.</p></details>
//               <details><summary>Can I change or cancel a reservation?<span aria-hidden="true">+</span></summary><p>Sign in and open My bookings to review the available actions. If a prepaid reservation is cancelled or rejected, its payment is sent for refund review.</p></details>
//               <details><summary>When do I pay for a pay-at-hotel booking?<span aria-hidden="true">+</span></summary><p>The booking is saved with payment due at the property. Pay the hotel directly at check-in according to the property’s accepted payment methods.</p></details>
//               <details><summary>Where can I find my booking reference?<span aria-hidden="true">+</span></summary><p>Your booking reference appears on the reservation confirmation page and in My bookings after you sign in to your account.</p></details>
//             </div>
//           </div>
//         </section>
//       </main>
//     </SiteLayout>
//   );
// }

// export default ContactPage;












import React, { useState } from 'react';
import { ArrowRight, Clock3, ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import SiteLayout from '../components/common/SiteLayout';
import './ContactPage.css';

const contactLocation = 'Rishikesh, Uttarakhand, India';
const mapQuery = encodeURIComponent(contactLocation);
const faqSideImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85';

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const submitContact = (event) => {
    event.preventDefault();
    setSubmitted(true);
    event.currentTarget.reset();
  };

  return (
    <SiteLayout>
      <main className="contact-page">
        <div className="page-banner">
          <div className="section-shell contact-banner-inner">
            <p className="eyebrow contact-banner-eyebrow">WE’RE HERE TO HELP</p>
            <h1>Let’s make your<br /><em>next stay easy.</em></h1>
            <p className="contact-banner-subtitle">Questions, a special request or just want to say hello? We’re listening.</p>
          </div>
        </div>

        <div className="section-shell contact-layout">
          <section className="contact-details">
            <p className="eyebrow">GET IN TOUCH</p>
            <h2>A real person<br /><em>is just a note away.</em></h2>
            <p className="contact-lead">
              Our small guest team is happy to help with a booking, a room question or a little inspiration.
            </p>
            <div className="contact-detail-list">
              <div className="contact-detail-item">
                <span className="contact-detail-icon" aria-hidden="true"><Phone size={17} /></span>
                <div>
                  <small>CALL US</small>
                  <a href="tel:+918679222309">+91 86792 22309</a>
                </div>
              </div>
              <div className="contact-detail-item">
                <span className="contact-detail-icon" aria-hidden="true"><Mail size={17} /></span>
                <div>
                  <small>EMAIL US</small>
                  <a href="mailto:hello@staynest.in">hello@staynest.in</a>
                </div>
              </div>
              <div className="contact-detail-item">
                <span className="contact-detail-icon" aria-hidden="true"><MapPin size={17} /></span>
                <div>
                  <small>FIND US</small>
                  <p>{contactLocation}</p>
                </div>
              </div>
              <div className="contact-detail-item">
                <span className="contact-detail-icon" aria-hidden="true"><Clock3 size={17} /></span>
                <div>
                  <small>GUEST SUPPORT</small>
                  <p>Daily, 9:00 AM – 7:00 PM IST</p>
                </div>
              </div>
            </div>
          </section>

          <section className="contact-form-panel">
            <p className="eyebrow">SEND A NOTE</p>
            <h2>How can we help?</h2>
            {submitted && (
              <p className="contact-success" role="status">
                Thanks for reaching out. Your demo message is ready for our guest team.
              </p>
            )}
            <form className="contact-form" onSubmit={submitContact}>
              <label className="form-field">
                <span>Your name</span>
                <input name="name" autoComplete="name" required onChange={() => submitted && setSubmitted(false)} />
              </label>
              <label className="form-field">
                <span>Email address</span>
                <input name="email" type="email" autoComplete="email" required />
              </label>
              <label className="form-field">
                <span>What’s on your mind?</span>
                <select name="topic" defaultValue="Booking enquiry">
                  <option>Booking enquiry</option>
                  <option>Room question</option>
                  <option>Special request</option>
                  <option>Something else</option>
                </select>
              </label>
              <label className="form-field">
                <span>Your message</span>
                <textarea name="message" rows="4" required />
              </label>
              <button className="button button-primary contact-submit-btn" type="submit">
                Send message <ArrowRight size={15} />
              </button>
              <small className="contact-form-note">This demo form does not send personal information to a server.</small>
            </form>
          </section>
        </div>

        <section className="section-shell contact-map-section" aria-labelledby="contact-map-title">
          <div className="contact-map-copy">
            <p className="eyebrow">COME SAY HELLO</p>
            <h2 id="contact-map-title">Find us in <em>Rishikesh.</em></h2>
            <p>
              Our guest support team is based in Rishikesh, Uttarakhand. Open the map for directions and
              nearby landmarks.
            </p>
            <a
              className="contact-map-link"
              href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
              target="_blank"
              rel="noreferrer"
            >
              Open in Google Maps <ExternalLink size={15} />
            </a>
          </div>
          <div className="contact-map-frame">
            <iframe
              title={`Map showing ${contactLocation}`}
              src={`https://maps.google.com/maps?q=${mapQuery}&z=12&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </section>

        <section className="contact-faq-section" aria-labelledby="contact-faq-title">
          <div className="section-shell">
            <div className="contact-faq-heading">
              <p className="eyebrow">A FEW HELPFUL ANSWERS</p>
              <h2 id="contact-faq-title">Frequently asked <em>questions.</em></h2>
              <p>Quick answers about making and managing your StayNest reservation.</p>
            </div>
            <div className="contact-faq-grid">
              <div className="contact-faq-media">
                <img
                  src={faqSideImage}
                  alt="Peaceful resort stay for StayNest guests"
                  loading="lazy"
                />
              </div>
              <div className="contact-faq-list">
                <details>
                  <summary>How do I book a stay?<span className="faq-plus" aria-hidden="true">+</span></summary>
                  <p>
                    Choose a property and room, enter your dates and guest details, then select prepaid online
                    payment or pay at the hotel when that option is available.
                  </p>
                </details>
                <details>
                  <summary>When is an online booking confirmed?<span className="faq-plus" aria-hidden="true">+</span></summary>
                  <p>
                    After Razorpay verifies your payment, your reservation is sent to the hotel for review. You can
                    check its Pending or Confirmed status in your account bookings.
                  </p>
                </details>
                <details>
                  <summary>Can I change or cancel a reservation?<span className="faq-plus" aria-hidden="true">+</span></summary>
                  <p>
                    Sign in and open My bookings to review the available actions. If a prepaid reservation is
                    cancelled or rejected, its payment is sent for refund review.
                  </p>
                </details>
                <details>
                  <summary>When do I pay for a pay-at-hotel booking?<span className="faq-plus" aria-hidden="true">+</span></summary>
                  <p>
                    The booking is saved with payment due at the property. Pay the hotel directly at check-in
                    according to the property’s accepted payment methods.
                  </p>
                </details>
                <details>
                  <summary>Where can I find my booking reference?<span className="faq-plus" aria-hidden="true">+</span></summary>
                  <p>
                    Your booking reference appears on the reservation confirmation page and in My bookings after you
                    sign in to your account.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}

export default ContactPage;
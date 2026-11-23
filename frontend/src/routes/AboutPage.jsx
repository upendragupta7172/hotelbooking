// import React from 'react';
// import { ArrowRight, Compass, Eye, Heart, Leaf, MapPin, Sparkles } from 'lucide-react';
// import { Link } from 'react-router-dom';
// import SiteLayout from '../components/common/SiteLayout';

// const values = [
//   { icon: Heart, title: 'Care, in every detail', text: 'The best hospitality is thoughtful without needing to announce itself.' },
//   { icon: Leaf, title: 'A sense of place', text: 'We look for stays that feel connected to their landscapes and communities.' },
//   { icon: Sparkles, title: 'Room to be yourself', text: 'A little breathing space, a warm welcome and the freedom to find your own pace.' },
// ];

// const approach = [
//   { icon: Compass, title: 'Places with a point of view', text: 'Find stays chosen for their character, comfort and connection to the places around them.' },
//   { icon: Eye, title: 'The details, made clear', text: 'Get to know the rooms, amenities and essentials before you decide where to stay.' },
//   { icon: Heart, title: 'A journey at your pace', text: 'Choose what suits your plans, review your details and book with confidence.' },
// ];

// function AboutPage() {
//   return (
//     <SiteLayout>
//       <main className="about-page">
//         <section className="about-hero">
//           <img src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=2200&q=85" alt="The river meeting the mountains" />
//           <div className="about-hero-shade" />
//           <div className="about-hero-copy">
//             <p className="eyebrow">A LITTLE ABOUT US</p>
//             <h1>We believe a good stay<br />can <em>change your pace.</em></h1>
//           </div>
//         </section>
//         <section className="about-intro section-shell">
//           <div><p className="eyebrow">THE STAYNEST STORY</p><h2>Discover comfort.<br /><em>Experience luxury.</em></h2></div>
//           <div><p>StayNest brings together independent stays with a distinct sense of place and the kind of hospitality that feels like being looked after.</p><p>From river-side mornings in Rishikesh to the cedar-scented lanes of Mussoorie, we make it easier to find a stay that feels right for you — and to make every part of the journey feel a little more considered.</p><Link className="button button-primary" to="/hotels">Explore our stays <ArrowRight size={15} /></Link></div>
//         </section>
//         <section className="about-feature">
//           <div className="about-feature-image">
//             <img src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=85" alt="A peaceful mountain landscape at the edge of a lake" loading="lazy" />
//             <span>MADE FOR A CHANGE OF SCENE</span>
//           </div>
//           <div className="about-feature-copy">
//             <p className="eyebrow">MORE THAN A PLACE TO SLEEP</p>
//             <h2>Let the place<br />set the <em>pace.</em></h2>
//             <p>Some trips call for a view that takes your breath away. Others are about a familiar welcome, a slower morning or simply having room to do nothing at all.</p>
//             <p>We bring together stays with their own character, so you can spend less time searching and more time looking forward to the journey.</p>
//             <Link className="text-link" to="/hotels">Find your kind of stay <ArrowRight size={16} /></Link>
//           </div>
//         </section>
//         <section className="about-values">
//           <div className="section-shell">
//             <div className="experience-top"><p className="eyebrow">WHAT MATTERS TO US</p><h2>Good hospitality<br /><em>feels like something.</em></h2></div>
//             <div className="about-values-grid">{values.map(({ icon: Icon, title, text }) => <article key={title}><Icon size={22} /><h3>{title}</h3><p>{text}</p></article>)}</div>
//           </div>
//         </section>
//         <section className="about-approach section-shell">
//           <div className="about-approach-heading">
//             <p className="eyebrow">A THOUGHTFUL WAY TO GET AWAY</p>
//             <h2>From the first search<br />to <em>your own somewhere.</em></h2>
//           </div>
//           <div className="about-approach-grid">
//             {approach.map(({ icon: Icon, title, text }, index) => (
//               <article key={title}>
//                 <span className="about-approach-number">0{index + 1}</span>
//                 <Icon size={22} aria-hidden="true" />
//                 <h3>{title}</h3>
//                 <p>{text}</p>
//               </article>
//             ))}
//           </div>
//           <Link className="about-approach-link" to="/contact"><MapPin size={16} /> Have a question about your stay? <span>We’re here to help <ArrowRight size={15} /></span></Link>
//         </section>
//         <section className="about-cta">
//           <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
//           <h2>Come find your<br /><em>somewhere.</em></h2>
//           <Link className="button button-primary" to="/hotels">Find a stay <ArrowRight size={15} /></Link>
//         </section>
//       </main>
//     </SiteLayout>
//   );
// }

// export default AboutPage;









import React from 'react';
import { ArrowRight, Compass, Eye, Heart, Leaf, MapPin, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import SiteLayout from '../components/common/SiteLayout';
import './AboutPage.css';

const values = [
  { icon: Heart, title: 'Care, in every detail', text: 'The best hospitality is thoughtful without needing to announce itself.' },
  { icon: Leaf, title: 'A sense of place', text: 'We look for stays that feel connected to their landscapes and communities.' },
  { icon: Sparkles, title: 'Room to be yourself', text: 'A little breathing space, a warm welcome and the freedom to find your own pace.' },
];

const approach = [
  { icon: Compass, title: 'Places with a point of view', text: 'Find stays chosen for their character, comfort and connection to the places around them.' },
  { icon: Eye, title: 'The details, made clear', text: 'Get to know the rooms, amenities and essentials before you decide where to stay.' },
  { icon: Heart, title: 'A journey at your pace', text: 'Choose what suits your plans, review your details and book with confidence.' },
];

function AboutPage() {
  return (
    <SiteLayout>
      <main className="about-page">
        <section className="about-hero">
          <img
            src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=2200&q=85"
            alt="The river meeting the mountains"
          />
          <div className="about-hero-shade" />
          <div className="about-hero-copy section-shell">
            <p className="eyebrow about-hero-eyebrow">A LITTLE ABOUT US</p>
            <h1>We believe a good stay<br />can <em>change your pace.</em></h1>
          </div>
        </section>

        <section className="about-intro section-shell">
          <div className="about-intro-heading">
            <p className="eyebrow">THE STAYNEST STORY</p>
            <h2>Discover comfort.<br /><em>Experience luxury.</em></h2>
          </div>
          <div className="about-intro-body">
            <p>
              StayNest brings together independent stays with a distinct sense of place and the kind of
              hospitality that feels like being looked after.
            </p>
            <p>
              From river-side mornings in Rishikesh to the cedar-scented lanes of Mussoorie, we make it
              easier to find a stay that feels right for you — and to make every part of the journey feel a
              little more considered.
            </p>
            <Link className="button button-primary" to="/hotels">
              Explore our stays <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        <section className="about-feature">
          <div className="about-feature-image">
            <img
              src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=85"
              alt="A peaceful mountain landscape at the edge of a lake"
              loading="lazy"
            />
            <span className="about-feature-badge">MADE FOR A CHANGE OF SCENE</span>
          </div>
          <div className="about-feature-copy">
            <p className="eyebrow">MORE THAN A PLACE TO SLEEP</p>
            <h2>Let the place<br />set the <em>pace.</em></h2>
            <p>
              Some trips call for a view that takes your breath away. Others are about a familiar welcome,
              a slower morning or simply having room to do nothing at all.
            </p>
            <p>
              We bring together stays with their own character, so you can spend less time searching and
              more time looking forward to the journey.
            </p>
            <Link className="text-link" to="/hotels">
              Find your kind of stay <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        <section className="about-values">
          <div className="section-shell">
            <div className="experience-top">
              <p className="eyebrow">WHAT MATTERS TO US</p>
              <h2>Good hospitality<br /><em>feels like something.</em></h2>
            </div>
            <div className="about-values-grid">
              {values.map(({ icon: Icon, title, text }) => (
                <article className="about-value-card" key={title}>
                  <div className="about-icon-wrap" aria-hidden="true">
                    <Icon size={20} strokeWidth={1.7} />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about-approach section-shell">
          <div className="about-approach-heading">
            <p className="eyebrow">A THOUGHTFUL WAY TO GET AWAY</p>
            <h2>From the first search<br />to <em>your own somewhere.</em></h2>
          </div>
          <div className="about-approach-grid">
            {approach.map(({ icon: Icon, title, text }, index) => (
              <article className="about-approach-card" key={title}>
                <div className="about-approach-meta">
                  <span className="about-approach-number">0{index + 1}</span>
                  <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <Link className="about-approach-link" to="/contact">
            <MapPin size={16} aria-hidden="true" />
            <span>Have a question about your stay?</span>
            <strong>We’re here to help <ArrowRight size={15} /></strong>
          </Link>
        </section>

        <section className="about-cta">
          <div className="section-shell about-cta-inner">
            <p className="eyebrow about-cta-eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
            <h2>Come find your<br /><em>somewhere.</em></h2>
            <Link className="button button-primary about-cta-button" to="/hotels">
              Find a stay <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}

export default AboutPage;
// import React, { useContext, useEffect, useMemo, useState } from 'react';
// import { Link } from 'react-router-dom';
// import {
//   ArrowDownRight,
//   ArrowRight,
//   ArrowUpRight,
//   BadgePercent,
//   Heart,
//   Leaf,
//   Quote,
//   ShieldCheck,
//   Sparkles,
//   Star,
// } from 'lucide-react';
// import { formatPrice } from '../data/hotels';
// import { toHotelView } from '../utils/hotelView';
// import { BookingContext } from '../context/BookingContext';
// import BookingSearch from '../components/common/BookingSearch';
// import HotelCard from '../components/common/HotelCard';
// import SiteLayout from '../components/common/SiteLayout';

// const destinations = [
//   {
//     name: 'Rishikesh',
//     state: 'UTTARAKHAND',
//     stays: 'Riverside calm & mountain air',
//     image: 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=1000&q=85',
//   },
//   {
//     name: 'Mussoorie',
//     state: 'UTTARAKHAND',
//     stays: 'Cloud-kissed hillside escapes',
//     image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1000&q=85',
//   },
//   {
//     name: 'Jim Corbett',
//     state: 'UTTARAKHAND',
//     stays: 'A slower side of the wild',
//     image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=85',
//   },
// ];

// const reasons = [
//   { icon: Heart, title: 'Thoughtfully chosen', text: 'Every stay is selected for its sense of place, warmth and care.' },
//   { icon: ShieldCheck, title: 'A little more personal', text: 'Clear details and real people to help you plan with confidence.' },
//   { icon: Leaf, title: 'Rooted in the moment', text: 'Local experiences and unhurried comforts, made for memorable days.' },
//   { icon: Sparkles, title: 'The details matter', text: 'From the first hello to the last cup of chai, we make it feel easy.' },
// ];

// const steps = [
//   ['01', 'Choose Hotel', 'Browse a considered collection of stays in places worth slowing down for.'],
//   ['02', 'Select Room', 'Find the room that fits your people, your plans and your pace.'],
//   ['03', 'Enter Guest Details', 'Share the essentials and review every detail before you book.'],
//   ['04', 'Confirm Your Booking', 'Pay securely online or settle your bill at the hotel.'],
// ];

// const testimonials = [
//   { quote: 'A beautiful pause from the everyday. We loved the river views, the slow breakfasts and how welcome we felt.', name: 'Meera & Arjun', location: 'Mumbai · Riverstone House' },
//   { quote: 'The kind of mountain stay that makes you forget to check your phone. We are already planning a return.', name: 'Nisha Kapoor', location: 'Delhi · Cedar & Sage' },
//   { quote: 'Warm, thoughtful hospitality from the first message to checkout. The room was lovely and the forest walks were special.', name: 'Kabir Malhotra', location: 'Pune · Aranya Hills Retreat' },
// ];

// function Newsletter() {
//   const [email, setEmail] = useState('');
//   const [subscribed, setSubscribed] = useState(false);

//   const subscribe = (event) => {
//     event.preventDefault();
//     setSubscribed(true);
//     setEmail('');
//   };

//   return (
//     <section className="newsletter-section">
//       <div>
//         <p className="eyebrow">A LITTLE NOTE FROM US</p>
//         <h2>Good places.<br /><em>Good things to come.</em></h2>
//         <p>Occasional inspiration, thoughtful offers and little reasons to get away.</p>
//       </div>
//       <form className="newsletter-form" onSubmit={subscribe}>
//         <label className="sr-only" htmlFor="newsletter-email">Your email address</label>
//         <input id="newsletter-email" type="email" placeholder="Your email address" value={email} required onChange={(event) => setEmail(event.target.value)} />
//         <button type="submit">{subscribed ? 'You’re on the list' : 'Sign me up'} <ArrowRight size={16} /></button>
//         <span>{subscribed ? 'Thank you — a little StayNest inspiration is on its way.' : 'By subscribing, you agree to receive StayNest updates.'}</span>
//       </form>
//     </section>
//   );
// }

// function HomePage() {
//   const { updateSearch } = useContext(BookingContext);
//   const [hotelCatalog, setHotelCatalog] = useState([]);
//   const [catalogLoading, setCatalogLoading] = useState(true);
//   const [catalogError, setCatalogError] = useState('');

//   useEffect(() => {
//     let active = true;
//     fetch('/api/hotels')
//       .then(async (res) => {
//         const payload = await res.json().catch(() => ({}));
//         if (!res.ok) throw new Error(payload.message || 'Unable to load stays.');
//         return payload;
//       })
//       .then((data) => {
//         if (active) setHotelCatalog(Array.isArray(data) ? data.map(toHotelView) : []);
//       })
//       .catch((err) => { if (active) setCatalogError(err.message || 'Unable to load stays.'); })
//       .finally(() => { if (active) setCatalogLoading(false); });
//     return () => { active = false; };
//   }, []);

//   const featuredHotels = hotelCatalog.slice(0, 3);
//   const featuredRoomPairs = useMemo(() => hotelCatalog
//     .flatMap((hotel) => hotel.rooms.map((room) => ({ hotel, room })))
//     .slice(0, 6), [hotelCatalog]);

//   const selectDestination = (name) => {
//     updateSearch({ destination: name, checkIn: '', checkOut: '', guests: 2, adults: 2, rooms: 1 });
//   };

//   return (
//     <SiteLayout>
//       <main>
//         <section className="hero-section home-hero">
//           <img
//             className="hero-image"
//             src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2400&q=90"
//             alt="A quiet resort with a pool in the Himalayan foothills"
//             fetchPriority="high"
//           />
//           <div className="hero-shade" />
//           <div className="hero-copy">
//             <p className="eyebrow hero-eyebrow"><span /> DISCOVER COMFORT. EXPERIENCE LUXURY.</p>
//             <h1>Find your<br /><em>somewhere.</em></h1>
//             <p className="hero-description">
//               Thoughtful stays in the heart of Uttarakhand. Come away for a little more comfort,
//               calm and connection.
//             </p>
//             <a className="hero-link" href="#destinations">Explore destinations <ArrowDownRight size={17} /></a>
//           </div>
//           <div className="hero-caption"><span>30° 05&apos; N&nbsp; 78° 16&apos; E</span><span>UTTARAKHAND, INDIA</span></div>
//           <div className="hero-index"><span>01</span> / 04</div>
//           <div className="home-search-wrap"><BookingSearch /></div>
//         </section>

//         <section className="destination-section section-shell" id="destinations">
//           <div className="section-heading">
//             <div>
//               <p className="eyebrow">GO WHERE YOU FEEL GOOD</p>
//               <h2>Somewhere lovely<br /><em>is closer than you think.</em></h2>
//             </div>
//             <div className="section-intro">
//               <p>From river mornings to mountain evenings, find a setting that feels like yours.</p>
//               <Link className="text-link" to="/hotels">View all destinations <ArrowUpRight size={16} /></Link>
//             </div>
//           </div>
//           <div className="destination-grid">
//             {destinations.map((destination, index) => (
//               <Link className={`destination-card destination-card-${index + 1}`} to="/hotels" key={destination.name} onClick={() => selectDestination(destination.name)}>
//                 <img src={destination.image} alt={`${destination.name}, Uttarakhand`} loading="lazy" />
//                 <div className="destination-shade" />
//                 <div className="destination-copy">
//                   <span>{destination.state}</span>
//                   <h3>{destination.name}</h3>
//                   <p>{destination.stays}</p>
//                 </div>
//                 <span className="destination-arrow"><ArrowUpRight size={18} /></span>
//               </Link>
//             ))}
//           </div>
//         </section>

//         <section className="featured-section section-shell" id="collection">
//           <div className="section-heading">
//             <div>
//               <p className="eyebrow">THE STAYNEST COLLECTION</p>
//               <h2>Places to stay.<br /><em>Stories to take home.</em></h2>
//             </div>
//             <Link className="text-link" to="/hotels">Explore all hotels <ArrowUpRight size={16} /></Link>
//           </div>
//           <div className="featured-hotels-grid">
//             {featuredHotels.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} compact />)}
//             {!catalogLoading && !catalogError && featuredHotels.length === 0 && <div className="catalog-empty">No properties have been added yet.</div>}
//             {catalogError && <div className="catalog-empty">{catalogError}</div>}
//           </div>
//         </section>

//         <section className="staynest-story" id="story">
//           <div className="story-image">
//             <img src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1400&q=85" alt="A quiet river in the mountains" loading="lazy" />
//           </div>
//           <div className="story-copy">
            
//             <h2>Leave a little room for wonder.</h2>
//             <p className="story-body">The best journeys make space for the unexpected — a longer breakfast, a quiet walk by the river, a conversation that turns into the evening. We bring together warm hospitality and places with a point of view, so you can find your own kind of escape.</p>
//             <Link className="text-link" to="/about">A little about us <ArrowUpRight size={16} /></Link>
//           </div>
//         </section>

//         <section className="featured-rooms-section section-shell" id="rooms">
//           <div className="section-heading">
//             <div>
//               <p className="eyebrow">A ROOM TO CALL YOUR OWN</p>
//               <h2>Rest comes<br /><em>naturally here.</em></h2>
//             </div>
//             <Link className="text-link" to="/hotels">Browse all rooms <ArrowUpRight size={16} /></Link>
//           </div>
//           <div className="featured-room-grid">
//             {featuredRoomPairs.slice(0, 3).map(({ hotel, room }) => (
//                 <article className="featured-room-card best-selling-card" key={`${hotel.id}-${room.id}`}>
//                   <Link to={`/hotels/${hotel.id}`} className="featured-room-image best-selling-image">
//                     {room.image && <img src={room.image} alt={room.name} loading="lazy" />}
//                     <span className="best-selling-badge">{hotel.propertyType || 'Stay'}</span>
//                   </Link>
//                   <div className="featured-room-info best-selling-info">
//                     <div><p>{hotel.name}</p><h3>{room.name}</h3><span>{room.amenities.slice(0, 3).join(' · ')}</span></div>
//                     <div><small>FROM</small><strong>{formatPrice(room.price)}</strong><span>/ night</span></div>
//                     <Link className="button button-primary featured-room-cta" to={`/hotels/${hotel.id}`}>View room</Link>
//                   </div>
//                 </article>
//             ))}
//             {!catalogLoading && featuredRoomPairs.length === 0 && <div className="catalog-empty">Room listings will appear here when rooms are added to your properties.</div>}
//           </div>
//         </section>

//         <section className="best-selling-section section-shell" id="best-selling-rooms">
//           <div className="section-heading">
//             <div>
//               <p className="eyebrow">ROOMS TO MAKE YOUR OWN</p>
//               <h2>Find a room<br /><em>for your next escape.</em></h2>
//             </div>
//             <Link className="text-link" to="/hotels">See all favourites <ArrowUpRight size={16} /></Link>
//           </div>
//           <div className="best-selling-grid">
//             {featuredRoomPairs.slice(3, 6).map(({ hotel, room }) => (
//               <article className="best-selling-card" key={`${hotel.id}-${room.id}`}>
//                 <Link to={`/hotels/${hotel.id}`} className="best-selling-image">
//                   {room.image && <img src={room.image} alt={room.name} loading="lazy" />}
//                   <span className="best-selling-badge">{hotel.propertyType || 'Stay'}</span>
//                 </Link>
//                 <div className="best-selling-info">
//                   <div className="best-selling-meta">
//                     <span>{hotel.city}</span>
//                     <span>{hotel.rating} ★</span>
//                   </div>
//                   <h3>{room.name}</h3>
//                   <p>{hotel.name}</p>
//                   <div className="best-selling-footer">
//                     <div>
//                       <small>From</small>
//                       <strong>{formatPrice(room.price)}</strong>
//                     </div>
//                     <Link className="button button-primary" to={`/hotels/${hotel.id}`}>View room</Link>
//                   </div>
//                 </div>
//               </article>
//             ))}
//             {!catalogLoading && featuredRoomPairs.slice(3, 6).length < 3 && <div className="catalog-empty">More rooms will appear here as properties add their room inventory.</div>}
//           </div>
//         </section>

//         <section className="why-section">
//           <div className="section-shell">
//             <div className="why-heading">
//               <p className="eyebrow">A DIFFERENT KIND OF GETAWAY</p>
//               <h2>Why travel<br /><em>with StayNest?</em></h2>
//               <p>We make finding a good stay feel just as good as being there.</p>
//             </div>
//             <div className="why-grid">
//               {reasons.map(({ icon: Icon, title, text }, index) => (
//                 <article className="why-card" key={title}>
//                   <span className="why-index">0{index + 1}</span>
//                   <Icon size={22} strokeWidth={1.5} />
//                   <h3>{title}</h3>
//                   <p>{text}</p>
//                 </article>
//               ))}
//             </div>
//           </div>
//         </section>

//         <section className="booking-steps-section section-shell" id="experience">
//           <div className="experience-top">
//             <p className="eyebrow">A FEW EASY STEPS</p>
//             <h2>Good stays.<br /><em>Beautifully simple.</em></h2>
//             <p className="steps-subtitle">A clear, thoughtful journey from first search to check-in.</p>
//           </div>
//           <div className="steps-grid">
//             {steps.map(([number, title, description]) => (
//               <article className="step-card" key={number}>
//                 <span className="step-number">{number}</span>
//                 <div className="step-rule"><span /></div>
//                 <h3>{title}</h3>
//                 <p>{description}</p>
//               </article>
//             ))}
//           </div>
//         </section>

//         <section className="offer-section">
//           <div className="offer-photo  p">
//             <img src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=85" alt="A private villa tucked into a garden" loading="lazy" />
//           </div>
//           <div className="offer-copy">
//             <div className="offer-icon"><BadgePercent size={22} /></div>
//             <p className="eyebrow">A LITTLE MORE REASON TO GO</p>
//             <h2>Your next escape<br />comes with <em>a little extra.</em></h2>
//             <p>Explore current stays and apply an available promo code at checkout. Every code is checked against live offer terms before payment.</p>
//             <Link className="button button-primary" to="/hotels">Explore stays <ArrowRight size={15} /></Link>
//             <small>Available coupons are loaded live at checkout.</small>
//           </div>
//         </section>

//         <section className="testimonials-section section-shell">
//           <div className="experience-top">
//             <p className="eyebrow">KIND WORDS, KEPT CLOSE</p>
//             <h2>Made memorable<br /><em>by the moments.</em></h2>
//           </div>
//           <div className="testimonials-grid">
//             {testimonials.map((testimonial) => (
//               <article className="testimonial-card" key={testimonial.name}>
//                 <Quote size={22} />
//                 <div className="testimonial-stars" aria-label="5 out of 5 stars"><Star /><Star /><Star /><Star /><Star /></div>
//                 <blockquote>“{testimonial.quote}”</blockquote>
//                 <div className="testimonial-author"><strong>{testimonial.name}</strong><span>{testimonial.location}</span></div>
//               </article>
//             ))}
//           </div>
//         </section>

//         <Newsletter />

//         <section className="closing-section">
//           <img src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2200&q=85" alt="A peaceful mountain lake at golden hour" loading="lazy" />
//           <div className="closing-overlay" />
//           <div className="closing-copy">
//             <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
//             <h2>A little closer<br />to <em>somewhere lovely.</em></h2>
//             <Link to="/hotels" className="closing-button">Find your stay <ArrowRight size={17} /></Link>
//           </div>
//         </section>
//       </main>
//     </SiteLayout>
//   );
// }

// export default HomePage;










import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgePercent,
  Heart,
  Leaf,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import { formatPrice } from '../data/hotels';
import { toHotelView } from '../utils/hotelView';
import { BookingContext } from '../context/BookingContext';
import BookingSearch from '../components/common/BookingSearch';
import HotelCard from '../components/common/HotelCard';
import SiteLayout from '../components/common/SiteLayout';
import './HomePage.css';

const destinations = [
  {
    name: 'Rishikesh',
    state: 'UTTARAKHAND',
    stays: 'Riverside calm & mountain air',
    image: 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=1000&q=85',
  },
  {
    name: 'Mussoorie',
    state: 'UTTARAKHAND',
    stays: 'Cloud-kissed hillside escapes',
    image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1000&q=85',
  },
  {
    name: 'Jim Corbett',
    state: 'UTTARAKHAND',
    stays: 'A slower side of the wild',
    image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=85',
  },
];

const reasons = [
  { icon: Heart, title: 'Thoughtfully chosen', text: 'Every stay is selected for its sense of place, warmth and care.' },
  { icon: ShieldCheck, title: 'A little more personal', text: 'Clear details and real people to help you plan with confidence.' },
  { icon: Leaf, title: 'Rooted in the moment', text: 'Local experiences and unhurried comforts, made for memorable days.' },
  { icon: Sparkles, title: 'The details matter', text: 'From the first hello to the last cup of chai, we make it feel easy.' },
];

const steps = [
  ['01', 'Choose Hotel', 'Browse a considered collection of stays in places worth slowing down for.'],
  ['02', 'Select Room', 'Find the room that fits your people, your plans and your pace.'],
  ['03', 'Enter Guest Details', 'Share the essentials and review every detail before you book.'],
  ['04', 'Confirm Your Booking', 'Pay securely online or settle your bill at the hotel.'],
];

const testimonials = [
  { quote: 'A beautiful pause from the everyday. We loved the river views, the slow breakfasts and how welcome we felt.', name: 'Meera & Arjun', location: 'Mumbai · Riverstone House' },
  { quote: 'The kind of mountain stay that makes you forget to check your phone. We are already planning a return.', name: 'Nisha Kapoor', location: 'Delhi · Cedar & Sage' },
  { quote: 'Warm, thoughtful hospitality from the first message to checkout. The room was lovely and the forest walks were special.', name: 'Kabir Malhotra', location: 'Pune · Aranya Hills Retreat' },
];

function Newsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = (event) => {
    event.preventDefault();
    setSubscribed(true);
    setEmail('');
  };

  return (
    <section className="newsletter-section">
      <div className="section-shell newsletter-inner">
        <div>
          <p className="eyebrow">A LITTLE NOTE FROM US</p>
          <h2>Good places.<br /><em>Good things to come.</em></h2>
          <p>Occasional inspiration, thoughtful offers and little reasons to get away.</p>
        </div>
        <form className="newsletter-form" onSubmit={subscribe}>
          <div className="newsletter-input-row">
            <label className="sr-only" htmlFor="newsletter-email">Your email address</label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Your email address"
              value={email}
              required
              onChange={(event) => {
                setEmail(event.target.value);
                if (subscribed) setSubscribed(false);
              }}
            />
            <button type="submit">{subscribed ? 'You’re on the list' : 'Sign me up'} <ArrowRight size={16} /></button>
          </div>
          <span>{subscribed ? 'Thank you — a little StayNest inspiration is on its way.' : 'By subscribing, you agree to receive StayNest updates.'}</span>
        </form>
      </div>
    </section>
  );
}

function HomePage() {
  const { updateSearch } = useContext(BookingContext);
  const [hotelCatalog, setHotelCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/hotels')
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.message || 'Unable to load stays.');
        return payload;
      })
      .then((data) => {
        if (active) setHotelCatalog(Array.isArray(data) ? data.map(toHotelView) : []);
      })
      .catch((err) => { if (active) setCatalogError(err.message || 'Unable to load stays.'); })
      .finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, []);

  const featuredHotels = hotelCatalog.slice(0, 3);
  const featuredRoomPairs = useMemo(() => hotelCatalog
    .flatMap((hotel) => hotel.rooms.map((room) => ({ hotel, room })))
    .slice(0, 6), [hotelCatalog]);

  const selectDestination = (name) => {
    updateSearch({ destination: name, checkIn: '', checkOut: '', guests: 2, adults: 2, rooms: 1 });
  };

  return (
    <SiteLayout>
      <main className="home-main">
        <section className="hero-section home-hero">
          <img
            className="hero-image"
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2400&q=90"
            alt="A quiet resort with a pool in the Himalayan foothills"
            fetchPriority="high"
          />
          <div className="hero-shade" />
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow"><span /> DISCOVER COMFORT. EXPERIENCE LUXURY.</p>
            <h1>Find your<br /><em>somewhere.</em></h1>
            <p className="hero-description">
              Thoughtful stays in the heart of Uttarakhand. Come away for a little more comfort,
              calm and connection.
            </p>
            <a className="hero-link" href="#destinations">Explore destinations <ArrowDownRight size={17} /></a>
          </div>
          <div className="hero-caption"><span>30° 05&apos; N&nbsp; 78° 16&apos; E</span><span>UTTARAKHAND, INDIA</span></div>
          <div className="hero-index"><span>01</span> / 04</div>
          <div className="home-search-wrap"><BookingSearch /></div>
        </section>

        <section className="destination-section section-shell" id="destinations">
          <div className="section-heading">
            <div>
              <p className="eyebrow">GO WHERE YOU FEEL GOOD</p>
              <h2>Somewhere lovely<br /><em>is closer than you think.</em></h2>
            </div>
            <div className="section-intro">
              <p>From river mornings to mountain evenings, find a setting that feels like yours.</p>
              <Link className="text-link" to="/hotels">View all destinations <ArrowUpRight size={16} /></Link>
            </div>
          </div>
          <div className="destination-grid">
            {destinations.map((destination, index) => (
              <Link className={`destination-card destination-card-${index + 1}`} to="/hotels" key={destination.name} onClick={() => selectDestination(destination.name)}>
                <img src={destination.image} alt={`${destination.name}, Uttarakhand`} loading="lazy" />
                <div className="destination-shade" />
                <div className="destination-copy">
                  <span>{destination.state}</span>
                  <h3>{destination.name}</h3>
                  <p>{destination.stays}</p>
                </div>
                <span className="destination-arrow"><ArrowUpRight size={18} /></span>
              </Link>
            ))}
          </div>
        </section>

        <section className="featured-section section-shell" id="collection">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE STAYNEST COLLECTION</p>
              <h2>Places to stay.<br /><em>Stories to take home.</em></h2>
            </div>
            <Link className="text-link" to="/hotels">Explore all hotels <ArrowUpRight size={16} /></Link>
          </div>
          <div className="featured-hotels-grid">
            {featuredHotels.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} compact />)}
            {!catalogLoading && !catalogError && featuredHotels.length === 0 && <div className="catalog-empty">No properties have been added yet.</div>}
            {catalogError && <div className="catalog-empty">{catalogError}</div>}
          </div>
        </section>

        <section className="staynest-story" id="story">
          <div className="story-image">
            <img src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1400&q=85" alt="A quiet river in the mountains" loading="lazy" />
          </div>
          <div className="story-copy">
            <h2>Leave a little room for wonder.</h2>
            <p className="story-body">The best journeys make space for the unexpected — a longer breakfast, a quiet walk by the river, a conversation that turns into the evening. We bring together warm hospitality and places with a point of view, so you can find your own kind of escape.</p>
            <Link className="text-link" to="/about">A little about us <ArrowUpRight size={16} /></Link>
          </div>
        </section>

        <section className="featured-rooms-section section-shell" id="rooms">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A ROOM TO CALL YOUR OWN</p>
              <h2>Rest comes<br /><em>naturally here.</em></h2>
            </div>
            <Link className="text-link" to="/rooms">Browse all rooms <ArrowUpRight size={16} /></Link>
          </div>
          <div className="featured-room-grid">
            {featuredRoomPairs.slice(0, 3).map(({ hotel, room }) => (
              <article className="featured-room-card best-selling-card" key={`${hotel.id}-${room.id}`}>
                <Link to={`/hotels/${hotel.id}`} className="featured-room-image best-selling-image">
                  {room.image && <img src={room.image} alt={room.name} loading="lazy" />}
                  <span className="best-selling-badge">{hotel.propertyType || 'Stay'}</span>
                </Link>
                <div className="featured-room-info best-selling-info">
                  <div>
                    <p>{hotel.name}</p>
                    <h3>{room.name}</h3>
                    <span>{room.amenities.slice(0, 3).join(' · ')}</span>
                  </div>
                  <div className="featured-room-price">
                    <small>FROM</small>
                    <strong>{formatPrice(room.price)}</strong>
                    <span>/ night</span>
                  </div>
                  <Link className="button button-primary featured-room-cta" to={`/hotels/${hotel.id}`}>View room</Link>
                </div>
              </article>
            ))}
            {!catalogLoading && featuredRoomPairs.length === 0 && <div className="catalog-empty">Room listings will appear here when rooms are added to your properties.</div>}
          </div>
        </section>

        <section className="best-selling-section section-shell" id="best-selling-rooms">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ROOMS TO MAKE YOUR OWN</p>
              <h2>Find a room<br /><em>for your next escape.</em></h2>
            </div>
            <Link className="text-link" to="/hotels">See all favourites <ArrowUpRight size={16} /></Link>
          </div>
          <div className="best-selling-grid">
            {featuredRoomPairs.slice(3, 6).map(({ hotel, room }) => (
              <article className="best-selling-card" key={`${hotel.id}-${room.id}`}>
                <Link to={`/hotels/${hotel.id}`} className="best-selling-image">
                  {room.image && <img src={room.image} alt={room.name} loading="lazy" />}
                  <span className="best-selling-badge">{hotel.propertyType || 'Stay'}</span>
                </Link>
                <div className="best-selling-info">
                  <div className="best-selling-meta">
                    <span>{hotel.city}</span>
                    <span>{hotel.rating} ★</span>
                  </div>
                  <h3>{room.name}</h3>
                  <p>{hotel.name}</p>
                  <div className="best-selling-footer">
                    <div>
                      <small>From</small>
                      <strong>{formatPrice(room.price)}</strong>
                    </div>
                    <Link className="button button-primary" to={`/hotels/${hotel.id}`}>View room</Link>
                  </div>
                </div>
              </article>
            ))}
            {!catalogLoading && featuredRoomPairs.slice(3, 6).length < 3 && <div className="catalog-empty">More rooms will appear here as properties add their room inventory.</div>}
          </div>
        </section>

        <section className="why-section">
          <div className="section-shell">
           <div className="why-heading">
              <p className="eyebrow">A DIFFERENT KIND OF GETAWAY</p>
              <h2>Why travel<br /><em>with StayNest?</em></h2>
              <p>We make finding a good stay feel just as good as being there.</p>
            </div>
            <div className="why-grid">
              {reasons.map(({ icon: Icon, title, text }, index) => (
                <article className="why-card" key={title}>
                  <span className="why-index">0{index + 1}</span>
                  <Icon size={22} strokeWidth={1.5} />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="booking-steps-section section-shell" id="experience">
          <div className="experience-top">
            <p className="eyebrow">A FEW EASY STEPS</p>
            <h2>Good stays.<br /><em>Beautifully simple.</em></h2>
            <p className="steps-subtitle">A clear, thoughtful journey from first search to check-in.</p>
          </div>
          <div className="steps-grid">
            {steps.map(([number, title, description]) => (
              <article className="step-card" key={number}>
                <span className="step-number">{number}</span>
                <div className="step-rule"><span /></div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="offer-section">
          <div className="offer-photo">
            <img src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=85" alt="A private villa tucked into a garden" loading="lazy" />
          </div>
          <div className="offer-copy">
            <div className="offer-icon"><BadgePercent size={22} /></div>
            <p className="eyebrow">A LITTLE MORE REASON TO GO</p>
            <h2>Your next escape<br />comes with <em>a little extra.</em></h2>
            <p>Explore current stays and apply an available promo code at checkout. Every code is checked against live offer terms before payment.</p>
            <Link className="button button-primary" to="/hotels">Explore stays <ArrowRight size={15} /></Link>
            <small>Available coupons are loaded live at checkout.</small>
          </div>
        </section>

        <section className="testimonials-section section-shell">
          <div className="experience-top">
            <p className="eyebrow">KIND WORDS, KEPT CLOSE</p>
            <h2>Made memorable<br /><em>by the moments.</em></h2>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial) => (
              <article className="testimonial-card" key={testimonial.name}>
                <Quote size={22} />
                <div className="testimonial-stars" aria-label="5 out of 5 stars"><Star /><Star /><Star /><Star /><Star /></div>
                <blockquote>“{testimonial.quote}”</blockquote>
                <div className="testimonial-author"><strong>{testimonial.name}</strong><span>{testimonial.location}</span></div>
              </article>
            ))}
          </div>
        </section>

        <Newsletter />

        <section className="closing-section">
          <img src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2200&q=85" alt="A peaceful mountain lake at golden hour" loading="lazy" />
          <div className="closing-overlay" />
          <div className="closing-copy">
            <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
            <h2>A little closer<br />to <em>somewhere lovely.</em></h2>
            <Link to="/hotels" className="closing-button">Find your stay <ArrowRight size={17} /></Link>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}

export default HomePage;
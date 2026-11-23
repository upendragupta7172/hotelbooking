// import React, { useContext, useMemo, useState, useEffect } from 'react';
// import { ArrowDownUp, Filter, MapPin, X } from 'lucide-react';
// import { BookingContext } from '../context/BookingContext';
// import { formatPrice } from '../data/hotels';
// import { toHotelView } from '../utils/hotelView';

// import BookingSearch from '../components/common/BookingSearch';
// import HotelCard from '../components/common/HotelCard';
// import SiteLayout from '../components/common/SiteLayout';

// const sortOptions = [
//   { value: 'recommended', label: 'Recommended' },
//   { value: 'price-low', label: 'Price: low to high' },
//   { value: 'price-high', label: 'Price: high to low' },
//   { value: 'rating', label: 'Guest rating' },
// ];

// function HotelsPage() {
//   const { searchParams, updateSearch } = useContext(BookingContext);
//   const [sortBy, setSortBy] = useState('recommended');
//   const [maxPrice, setMaxPrice] = useState(null);
//   const [minRating, setMinRating] = useState(0);
//   const [propertyType, setPropertyType] = useState('');
//   const [amenities, setAmenities] = useState([]);
//   const [filtersOpen, setFiltersOpen] = useState(false);
//   const [loadError, setLoadError] = useState('');

//   const [hotelList, setHotelList] = useState([]);
//   const amenityOptions = [...new Set(hotelList.flatMap((hotel) => hotel.amenities || []))].sort();
//   const propertyTypes = [...new Set(hotelList.map((hotel) => hotel.propertyType).filter(Boolean))].sort();
//   const maxAvailablePrice = Math.max(...hotelList.map((hotel) => Number(hotel.startingPrice) || 0), 0);
//   const rangeMax = Math.max(maxAvailablePrice, 500);

// useEffect(() => {
//   fetch('/api/hotels')
//     .then(async (res) => {
//       const payload = await res.json().catch(() => []);
//       if (!res.ok) throw new Error(payload.message || 'Unable to load stays.');
//       return payload;
//     })
//     .then((data) => setHotelList(Array.isArray(data) ? data.map(toHotelView) : []))
//     .catch((err) => setLoadError(err.message || 'Unable to load stays.'));
// }, []);

// const results = useMemo(() => {
//   const destination = (searchParams.destination || '').toLowerCase();
//   const filtered = hotelList.filter((hotel) => {
//     const searchable = `${hotel.name} ${hotel.city} ${hotel.state} ${hotel.country} ${hotel.address} ${hotel.location} ${hotel.propertyType} ${hotel.shortDescription}`.toLowerCase();
//     const matchesDestination = !destination || destination === 'any destination' || searchable.includes(destination);
//     return (
//       matchesDestination &&
//       (maxPrice === null || hotel.startingPrice <= maxPrice) &&
//       hotel.rating >= minRating &&
//       (!propertyType || hotel.propertyType === propertyType) &&
//       amenities.every((amenity) => hotel.amenities && hotel.amenities.includes(amenity))
//     );
//   });

//   return filtered.sort((a, b) => {
//     if (sortBy === 'price-low') return a.startingPrice - b.startingPrice;
//     if (sortBy === 'price-high') return b.startingPrice - a.startingPrice;
//     if (sortBy === 'rating') return b.rating - a.rating;
//     return b.popularity - a.popularity;
//   });
// }, [hotelList, amenities, maxPrice, minRating, propertyType, searchParams.destination, sortBy]);

//   const toggleAmenity = (amenity) => {
//     setAmenities((current) => current.includes(amenity)
//       ? current.filter((item) => item !== amenity)
//       : [...current, amenity]);
//   };

//   const resetFilters = () => {
//     setMaxPrice(null);
//     setMinRating(0);
//     setPropertyType('');
//     setAmenities([]);
//     updateSearch({ ...searchParams, destination: 'Any destination' });
//   };

//   const filters = (
//     <div className="filters-content">
//       <div className="filter-heading"><h2>Refine your stay</h2><button type="button" onClick={resetFilters}>Clear all</button></div>
//       <fieldset className="filter-group">
//         <legend>Price per night</legend>
//         <div className="range-value">Up to <strong>{formatPrice(maxPrice)}</strong></div>
//         <input aria-label="Maximum price per night" type="range" min="0" max={rangeMax} step={Math.max(100, Math.ceil(rangeMax / 100))} value={maxPrice ?? rangeMax} onChange={(event) => setMaxPrice(Number(event.target.value))} />
//         <div className="range-ends"><span>₹0</span><span>{formatPrice(rangeMax)}+</span></div>
//       </fieldset>
//       <fieldset className="filter-group">
//         <legend>Guest rating</legend>
//         {[4.5, 4, 3.5].map((rating) => (
//           <label className="filter-choice" key={rating}>
//             <input type="radio" name="rating" checked={minRating === rating} onChange={() => setMinRating(rating)} />
//             <span>{rating}+ <span className="filter-stars">★</span></span>
//           </label>
//         ))}
//         <label className="filter-choice"><input type="radio" name="rating" checked={minRating === 0} onChange={() => setMinRating(0)} /><span>Any rating</span></label>
//       </fieldset>
//       <fieldset className="filter-group">
//         <legend>Property type</legend>
//         {['', ...propertyTypes].map((type) => (
//           <label className="filter-choice" key={type}>
//             <input type="radio" name="propertyType" checked={propertyType === type} onChange={() => setPropertyType(type)} />
//             <span>{type || 'All types'}</span>
//           </label>
//         ))}
//       </fieldset>
//       <fieldset className="filter-group">
//         <legend>Amenities</legend>
//         {amenityOptions.map((amenity) => (
//           <label className="filter-choice" key={amenity}>
//             <input type="checkbox" checked={amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} />
//             <span>{amenity}</span>
//           </label>
//         ))}
//       </fieldset>
//     </div>
//   );

//   const dates = searchParams.checkIn && searchParams.checkOut
//     ? `${searchParams.checkIn} — ${searchParams.checkOut}`
//     : 'Flexible dates';

//   return (
//     <SiteLayout>
//       <main className="listing-page">
//         <div className="page-banner">
//           <div className="section-shell">
//             <p className="eyebrow"><a href="/">HOME</a><span> / </span> STAYS</p>
//             <h1>Find your <em>somewhere.</em></h1>
//             <p>Thoughtful stays in the places you want to be.</p>
//             <BookingSearch compact />
//           </div>
//         </div>
//         <div className="section-shell listing-content">
//           <div className="listing-summary">
//             <div>
//               <p className="eyebrow">THE STAYNEST COLLECTION</p>
//               <h2>{results.length} {results.length === 1 ? 'stay' : 'stays'} to make your own</h2>
//               <p className="listing-search-summary"><MapPin size={14} /> {searchParams.destination || 'Uttarakhand'} <span>·</span> {dates} <span>·</span> {searchParams.adults || searchParams.guests || 2} guests, {searchParams.rooms || 1} room</p>
//             </div>
//             <div className="listing-tools">
//               <button className="mobile-filter-trigger" type="button" onClick={() => setFiltersOpen(true)}><Filter size={15} /> Filters</button>
//               <div className="listing-sort-bar" role="group" aria-label="Sort stays">
//                 <span className="listing-sort-label"><ArrowDownUp size={14} /> Sort by</span>
//                 {sortOptions.map((option) => (
//                   <button
//                     key={option.value}
//                     className={`listing-sort-option${sortBy === option.value ? ' active' : ''}`}
//                     type="button"
//                     aria-pressed={sortBy === option.value}
//                     onClick={() => setSortBy(option.value)}
//                   >
//                     {option.label}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>
//           <div className="listing-layout">
//             <aside className="filter-sidebar">{filters}</aside>
//             <section className="hotel-results" aria-live="polite">
//               {loadError ? <div className="no-results"><MapPin size={24} /><h3>Stays could not be loaded</h3><p>{loadError}</p><button className="button button-outline" type="button" onClick={() => window.location.reload()}>Try again</button></div> : results.length ? results.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} />) : (
//                 <div className="no-results">
//                   <MapPin size={24} />
//                   <h3>No stays found just yet</h3>
//                   <p>{searchParams.destination && searchParams.destination !== 'Any destination' ? `No stays match “${searchParams.destination}”. ` : ''}Try another destination or clear filters to see all available places.</p>
//                   <button className="button button-outline" type="button" onClick={resetFilters}>Clear filters</button>
//                 </div>
//               )}
//             </section>
//           </div>
//         </div>
//         {filtersOpen && (
//           <div className="filter-drawer-backdrop" role="presentation" onClick={() => setFiltersOpen(false)}>
//             <aside className="filter-drawer" role="dialog" aria-modal="true" aria-label="Hotel filters" onClick={(event) => event.stopPropagation()}>
//               <div className="drawer-title"><span>Filter stays</span><button aria-label="Close filters" type="button" onClick={() => setFiltersOpen(false)}><X size={20} /></button></div>
//               {filters}
//               <button className="button button-primary drawer-apply" type="button" onClick={() => setFiltersOpen(false)}>Show {results.length} stays</button>
//             </aside>
//           </div>
//         )}
//       </main>
//     </SiteLayout>
//   );
// }

// export default HotelsPage;






import React, { useContext, useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownUp, Filter, MapPin, RotateCcw, X } from 'lucide-react';
import { BookingContext } from '../context/BookingContext';
import { formatPrice } from '../data/hotels';
import { toHotelView } from '../utils/hotelView';

import BookingSearch from '../components/common/BookingSearch';
import HotelCard from '../components/common/HotelCard';
import SiteLayout from '../components/common/SiteLayout';
import './HotelsPage.css';

const sortOptions = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
  { value: 'rating', label: 'Guest rating' },
];

function HotelsPage() {
  const { searchParams, updateSearch } = useContext(BookingContext);
  const [sortBy, setSortBy] = useState('recommended');
  const [maxPrice, setMaxPrice] = useState(null);
  const [minRating, setMinRating] = useState(0);
  const [propertyType, setPropertyType] = useState('');
  const [amenities, setAmenities] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [hotelList, setHotelList] = useState([]);
  const amenityOptions = useMemo(
    () => [...new Set(hotelList.flatMap((hotel) => hotel.amenities || []))].sort(),
    [hotelList]
  );
  const propertyTypes = useMemo(
    () => [...new Set(hotelList.map((hotel) => hotel.propertyType).filter(Boolean))].sort(),
    [hotelList]
  );
  const maxAvailablePrice = useMemo(
    () => Math.max(...hotelList.map((hotel) => Number(hotel.startingPrice) || 0), 0),
    [hotelList]
  );
  const rangeMax = Math.max(maxAvailablePrice, 500);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    fetch('/api/hotels')
      .then(async (res) => {
        const payload = await res.json().catch(() => []);
        if (!res.ok) throw new Error(payload.message || 'Unable to load stays.');
        return payload;
      })
      .then((data) => {
        if (active) setHotelList(Array.isArray(data) ? data.map(toHotelView) : []);
      })
      .catch((err) => {
        if (active) setLoadError(err.message || 'Unable to load stays.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const results = useMemo(() => {
    const destination = (searchParams.destination || '').toLowerCase();
    const filtered = hotelList.filter((hotel) => {
      const searchable = `${hotel.name} ${hotel.city} ${hotel.state} ${hotel.country} ${hotel.address} ${hotel.location} ${hotel.propertyType} ${hotel.shortDescription}`.toLowerCase();
      const matchesDestination = !destination || destination === 'any destination' || searchable.includes(destination);
      return (
        matchesDestination &&
        (maxPrice === null || hotel.startingPrice <= maxPrice) &&
        hotel.rating >= minRating &&
        (!propertyType || hotel.propertyType === propertyType) &&
        amenities.every((amenity) => hotel.amenities && hotel.amenities.includes(amenity))
      );
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'price-low') return a.startingPrice - b.startingPrice;
      if (sortBy === 'price-high') return b.startingPrice - a.startingPrice;
      if (sortBy === 'rating') return b.rating - a.rating;
      return b.popularity - a.popularity;
    });
  }, [hotelList, amenities, maxPrice, minRating, propertyType, searchParams.destination, sortBy]);

  const activeFilterCount =
    (maxPrice !== null ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (propertyType ? 1 : 0) +
    amenities.length;

  const toggleAmenity = (amenity) => {
    setAmenities((current) => (current.includes(amenity)
      ? current.filter((item) => item !== amenity)
      : [...current, amenity]));
  };

  const resetFilters = () => {
    setMaxPrice(null);
    setMinRating(0);
    setPropertyType('');
    setAmenities([]);
    updateSearch({ ...searchParams, destination: 'Any destination' });
  };

  const filters = (
    <div className="filters-content">
      <div className="filter-heading">
        <h2>Refine your stay</h2>
        <button type="button" className="filter-reset-btn" onClick={resetFilters}>
          <RotateCcw size={13} /> Clear all
        </button>
      </div>

      <fieldset className="filter-group">
        <legend>Price per night</legend>
        <div className="range-value">
          Up to <strong>{formatPrice(maxPrice ?? rangeMax)}</strong>
        </div>
        <input
          aria-label="Maximum price per night"
          className="filter-range-input"
          type="range"
          min="0"
          max={rangeMax}
          step={Math.max(100, Math.ceil(rangeMax / 100))}
          value={maxPrice ?? rangeMax}
          onChange={(event) => setMaxPrice(Number(event.target.value))}
        />
        <div className="range-ends">
          <span>₹0</span>
          <span>{formatPrice(rangeMax)}+</span>
        </div>
      </fieldset>

      <fieldset className="filter-group">
        <legend>Guest rating</legend>
        {[4.5, 4, 3.5].map((rating) => (
          <label className={`filter-choice${minRating === rating ? ' is-selected' : ''}`} key={rating}>
            <input
              type="radio"
              name="rating"
              checked={minRating === rating}
              onChange={() => setMinRating(rating)}
            />
            <span>{rating}+ <span className="filter-stars">★</span></span>
          </label>
        ))}
        <label className={`filter-choice${minRating === 0 ? ' is-selected' : ''}`}>
          <input
            type="radio"
            name="rating"
            checked={minRating === 0}
            onChange={() => setMinRating(0)}
          />
          <span>Any rating</span>
        </label>
      </fieldset>

      <fieldset className="filter-group">
        <legend>Property type</legend>
        {['', ...propertyTypes].map((type) => (
          <label className={`filter-choice${propertyType === type ? ' is-selected' : ''}`} key={type || 'all'}>
            <input
              type="radio"
              name="propertyType"
              checked={propertyType === type}
              onChange={() => setPropertyType(type)}
            />
            <span>{type || 'All types'}</span>
          </label>
        ))}
      </fieldset>

      {amenityOptions.length > 0 && (
        <fieldset className="filter-group">
          <legend>Amenities</legend>
          {amenityOptions.map((amenity) => (
            <label className={`filter-choice${amenities.includes(amenity) ? ' is-selected' : ''}`} key={amenity}>
              <input
                type="checkbox"
                checked={amenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
              />
              <span>{amenity}</span>
            </label>
          ))}
        </fieldset>
      )}
    </div>
  );

  const dates = searchParams.checkIn && searchParams.checkOut
    ? `${searchParams.checkIn} — ${searchParams.checkOut}`
    : 'Flexible dates';

  return (
    <SiteLayout>
      <main className="listing-page">
        <div className="page-banner">
          <div className="section-shell listing-banner-inner">
            <nav className="listing-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">HOME</Link>
              <span>/</span>
              <span>STAYS</span>
            </nav>
            <h1>Find your <em>somewhere.</em></h1>
            <p className="listing-banner-subtitle">Thoughtful stays in the places you want to be.</p>
            <div className="listing-search-box">
              <BookingSearch compact />
            </div>
          </div>
        </div>

        <div className="section-shell listing-content">
          <div className="listing-summary">
            <div>
              <p className="eyebrow">THE STAYNEST COLLECTION</p>
              <h2>
                {loading
                  ? 'Finding stays for you…'
                  : `${results.length} ${results.length === 1 ? 'stay' : 'stays'} to make your own`}
              </h2>
              <p className="listing-search-summary">
                <MapPin size={14} />
                <span>{searchParams.destination || 'Uttarakhand'}</span>
                <span aria-hidden="true">·</span>
                <span>{dates}</span>
                <span aria-hidden="true">·</span>
                <span>{searchParams.adults || searchParams.guests || 2} guests, {searchParams.rooms || 1} room</span>
              </p>
            </div>

            <div className="listing-tools">
              <button
                className="mobile-filter-trigger"
                type="button"
                onClick={() => setFiltersOpen(true)}
              >
                <Filter size={15} />
                <span>Filters</span>
                {activeFilterCount > 0 && <span className="filter-count-pill">{activeFilterCount}</span>}
              </button>

              <div className="listing-sort-bar" role="group" aria-label="Sort stays">
                <span className="listing-sort-label"><ArrowDownUp size={14} /> Sort by</span>
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`listing-sort-option${sortBy === option.value ? ' active' : ''}`}
                    type="button"
                    aria-pressed={sortBy === option.value}
                    onClick={() => setSortBy(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="listing-layout">
            <aside className="filter-sidebar" aria-label="Stay filters">{filters}</aside>

            <section className="hotel-results" aria-live="polite">
              {loading ? (
                <div className="listing-loading-grid" aria-busy="true">
                  {[0, 1, 2].map((item) => (
                    <div className="listing-skeleton-card" key={item}>
                      <div className="skeleton-media" />
                      <div className="skeleton-lines">
                        <span />
                        <span className="short" />
                        <span className="mid" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : loadError ? (
                <div className="no-results">
                  <MapPin size={24} />
                  <h3>Stays could not be loaded</h3>
                  <p>{loadError}</p>
                  <button className="button button-outline" type="button" onClick={() => window.location.reload()}>
                    Try again
                  </button>
                </div>
              ) : results.length ? (
                results.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} />)
              ) : (
                <div className="no-results">
                  <MapPin size={24} />
                  <h3>No stays found just yet</h3>
                  <p>
                    {searchParams.destination && searchParams.destination !== 'Any destination'
                      ? `No stays match “${searchParams.destination}”. `
                      : ''}
                    Try another destination or clear filters to see all available places.
                  </p>
                  <button className="button button-outline" type="button" onClick={resetFilters}>
                    Clear filters
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>

        {filtersOpen && (
          <div className="filter-drawer-backdrop" role="presentation" onClick={() => setFiltersOpen(false)}>
            <aside
              className="filter-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Hotel filters"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="drawer-title">
                <span>Filter stays</span>
                <button aria-label="Close filters" type="button" onClick={() => setFiltersOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              {filters}
              <button className="button button-primary drawer-apply" type="button" onClick={() => setFiltersOpen(false)}>
                Show {results.length} stays
              </button>
            </aside>
          </div>
        )}
      </main>
    </SiteLayout>
  );
}

export default HotelsPage;
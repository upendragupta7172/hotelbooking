import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Utensils } from 'lucide-react';
import SiteLayout from '../components/common/SiteLayout';

const money = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount) || 0);

function DishCard({ dish }) {
  return (
    <article className={`explore-dish-card${!dish.available ? ' explore-dish-unavailable' : ''}`}>
      <div className="explore-dish-img-wrap">
        {dish.image
          ? <img src={dish.image} alt={dish.name} className="explore-dish-img" />
          : <div className="explore-dish-img explore-dish-img-fallback"><Utensils size={30} /></div>}
        {!dish.available && <span className="explore-dish-badge explore-dish-badge-unavail">Unavailable</span>}
      </div>
      <div className="explore-dish-body">
        <span className="explore-dish-category">{dish.category}</span>
        <h3 className="explore-dish-name">{dish.name}</h3>
        {dish.description && <p className="explore-dish-desc">{dish.description}</p>}
        <div className="explore-dish-footer">
          <strong className="explore-dish-price">{money(dish.price)}</strong>
          <span className="explore-dish-hotel">{dish.hotelName}</span>
        </div>
      </div>
    </article>
  );
}

function DiningPage() {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    setLoading(true);
    fetch('/api/hotels')
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.message || 'Unable to load dining menu.');
        return payload;
      })
      .then((data) => {
        const hotels = Array.isArray(data) ? data : [];
        const allDishes = [];
        hotels.forEach((hotel) => {
          if (Array.isArray(hotel.menu)) {
            hotel.menu.forEach((item) => {
              allDishes.push({
                _id: item._id || `${hotel._id}-${item.name}`,
                name: item.name,
                description: item.description || '',
                category: item.category || 'Uncategorized',
                price: Number(item.price) || 0,
                image: item.image || '',
                available: item.available !== false,
                hotelName: hotel.name || '',
                hotelId: hotel._id,
              });
            });
          }
        });
        setDishes(allDishes);
      })
      .catch((err) => setError(err.message || 'Unable to load dining menu.'))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(dishes.map((d) => d.category))).sort();
    return ['All', ...cats];
  }, [dishes]);

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return dishes;
    return dishes.filter((d) => d.category === activeCategory);
  }, [dishes, activeCategory]);

  return (
    <SiteLayout>
      <main className="explore-page">
        <div className="explore-hero">
          <div className="section-shell">
            <p className="eyebrow">ROOM SERVICE &amp; DINING</p>
            <h1>Our <em>Menu</em></h1>
            <p className="explore-hero-sub">Every dish available across our properties — updated live from our kitchen management system.</p>
          </div>
        </div>

        <div className="section-shell explore-content">
          {loading && (
            <div className="explore-state-center">
              <p className="explore-loading-text">Loading dining menu…</p>
            </div>
          )}

          {!loading && error && (
            <div className="explore-state-center">
              <Utensils size={40} className="explore-state-icon" />
              <h2>Could not load dining menu</h2>
              <p>{error}</p>
              <button type="button" className="button button-primary" onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && dishes.length === 0 && (
            <div className="explore-state-center">
              <Utensils size={48} className="explore-state-icon" />
              <h2>No dishes available right now</h2>
              <p>Check back soon — menu items will appear here as soon as they are added by the property manager.</p>
              <Link to="/hotels" className="button button-primary">Browse hotels <ArrowRight size={14} /></Link>
            </div>
          )}

          {!loading && !error && dishes.length > 0 && (
            <>
              {/* Category filter tabs */}
              {categories.length > 2 && (
                <div className="explore-category-tabs" role="tablist" aria-label="Filter by category">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={activeCategory === cat}
                      className={`explore-cat-tab${activeCategory === cat ? ' is-active' : ''}`}
                      onClick={() => setActiveCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              <div className="explore-results-bar">
                <span>{filtered.length} dish{filtered.length !== 1 ? 'es' : ''}{activeCategory !== 'All' ? ` in "${activeCategory}"` : ''}</span>
                <Link to="/hotels" className="text-link">All hotels <ArrowRight size={13} /></Link>
              </div>

              <div className="explore-grid explore-grid-dining">
                {filtered.map((dish) => (
                  <DishCard key={dish._id} dish={dish} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </SiteLayout>
  );
}

export default DiningPage;

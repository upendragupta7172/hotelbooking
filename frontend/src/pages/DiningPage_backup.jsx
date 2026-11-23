import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from '@/components/ui/card';
import { ForkAndKnife, Image, AlertCircle } from 'lucide-react';
import { api } from '@/utils/api';
import { formatPrice } from '@/data/hotels';

useEffect(() => {
    // Fetch hotels to get their embedded menu items
    fetch('/api/hotels')
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(payload.message || 'Unable to load dining menu.');
          setLoading(false);
          return;
        }
        const hotels = Array.isArray(payload) ? payload : [];
        const allDishes = [];

        hotels.forEach((hotel) => {
          if (hotel.menu && Array.isArray(hotel.menu)) {
            hotel.menu.forEach((item) => {
              allDishes.push({
                _id: item._id || `${hotel._id}-${item.name}`,
                name: item.name,
                description: item.description || '',
                category: item.category || 'Uncategorized',
                price: item.price || 0,
                image: item.image || '',
                available: item.available !== undefined ? item.available : true,
                hotelName: hotel.name || 'Unknown Hotel',
              });
            });
          }
        });

        setDishes(allDishes);
      })
      .catch((err) => {
        setError(err.message || 'Unable to load dining menu.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading && !error && dishes.length === 0) {
    // Loading state
  }

  if (error) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="mx-2 h-6 w-6 text-red-500 mb-4" />
          <h3 className="text-xl font-medium text-red-600">Error loading dining menu</h3>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()}>Try again</Button>
        </div>
      </div>
    );
  }

  if (dishes.length === 0) {
    return (
      <div className="py-20 px-4 text-center">
        <Image
          className="mx-auto h-32 w-32 object-contain mb-4"
          src="/placeholder-dish.svg"
          alt="No dishes available"
        />
        <h3 className="text-2xl font-medium mb-2">No dishes available right now</h3>
        <p className="text-muted-foreground mb-6">
          Check back later for new menu items.
        </p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Reload
        </Button>
      </div>
    );
  }

  // Group dishes by category
  const groupedDishes = useMemo(() => {
    const groups = {};
    dishes.forEach((dish) => {
      const category = dish.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(dish);
    });
    return groups;
  }, [dishes]);

  return (
    <div className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Room Service & Dining</h2>
            <p className="text-muted-foreground mt-1">Our culinary offerings</p>
          </div>
          <Link to="/hotels" className="btn-link">
            View all hotels
            <svg className="ml-1 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dishes.map((dish) => {
            const price = Number(dish.price) || 0;
            const available = dish.available ? 'Available' : 'Unavailable';

            return (
              <Card
                key={dish._id}
                className={`hover:shadow-lg hover:transition-shadow ${!dish.available ? 'opacity-50' : ''}`}
              >
                <CardHeader>
                  <img
                    src={dish.image || '/placeholder-dish.svg'}
                    alt={dish.name}
                    className="h-48 w-full object-cover rounded-t-md"
                  />
                  {!dish.available && (
                    <span className="absolute top-2 left-2 px-2 text-xs text-muted-foreground bg-black/20 rounded">Unavailable</span>
                  )}
                </CardHeader>
                <CardContent>
                  <h3 className="text-xl font-medium mb-1">{dish.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{dish.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-primary font-medium">₹{formatPrice(price)}</div>
                      <div className="text-xs text-muted-foreground">Per piece</div>
                    </div>
                    <div>
                      <div className="text-primary font-medium">{dish.hotelName}</div>
                      <div className="text-xs text-muted-foreground">From {dish.hotelName}</div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">
                    Category: {dish.category}
                  </p>
                </CardContent>
                <CardFooter>
                  {dish.available ? (
                    <Button
                      className="btn-primary w-full"
                      onClick={() => alert(`Add ${dish.name} (₹${formatPrice(price)}) to order`)}
                    >
                      Add to order
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">Currently unavailable</span>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DiningPage;
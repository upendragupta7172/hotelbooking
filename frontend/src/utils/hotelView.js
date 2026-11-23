const names = (values = []) => values.map((value) => typeof value === 'string' ? value : value?.name).filter(Boolean);

export function toHotelView(hotel) {
  const images = hotel.gallery?.length ? hotel.gallery : (hotel.images || []);
  const rooms = (hotel.rooms || []).map((room) => ({
    ...room,
    id: String(room._id || room.id || ''),
    name: room.type || room.name || room.roomNumber || '',
    images: room.images?.length ? room.images : (room.image ? [room.image] : []),
    videos: Array.isArray(room.videos) ? room.videos : [],
    basePrice: Number(room.price ?? room.pricePerNight ?? 0),
    discountPrice: room.discountPrice === null || room.discountPrice === undefined ? null : Number(room.discountPrice),
    price: room.discountPrice === null || room.discountPrice === undefined ? Number(room.price ?? room.pricePerNight ?? 0) : Number(room.discountPrice),
    image: room.images?.[0] || room.image || images[0] || '',
    capacity: room.capacity ?? 1,
    bookingsToday: Number(room.bookingsToday || 0),
    availableRoomCount: Number(room.availableRoomCount || 0),
    size: room.size || '',
    amenities: names(room.amenities),
    packages: (room.packages || []).map((plan) => ({
      ...plan,
      id: String(plan._id || plan.id || ''),
      pricePerNight: Number(plan.pricePerNight ?? 0),
      includedAmenities: names(plan.includedAmenities),
    })),
  }));
  const roomPrices = rooms.map((room) => room.price).filter((price) => price > 0);

  return {
    ...hotel,
    id: String(hotel._id || hotel.id || ''),
    state: hotel.state || hotel.country || '',
    location: hotel.location || hotel.address || hotel.city || '',
    startingPrice: Number(hotel.startingPrice ?? hotel.pricePerNight ?? (roomPrices.length ? Math.min(...roomPrices) : 0)),
    image: hotel.image || images[0] || '',
    gallery: images,
    videos: Array.isArray(hotel.videos) ? hotel.videos : [],
    amenities: names(hotel.amenities),
    shortDescription: hotel.shortDescription || hotel.description || '',
    description: hotel.description || hotel.shortDescription || '',
    rating: Number(hotel.rating || 0),
    reviewCount: Number(hotel.reviewCount || 0),
    popularity: Number(hotel.popularity || hotel.rating || 0),
    address: hotel.address || hotel.location || hotel.city || '',
    coordinates: hotel.coordinates || '',
    checkIn: hotel.checkIn || 'Check-in time set by property',
    checkOut: hotel.checkOut || 'Check-out time set by property',
    rooms,
    reviews: hotel.reviews || [],
    activity: {
      recentBookingCount: Number(hotel.activity?.recentBookingCount || 0),
      latestRoomId: hotel.activity?.latestRoomId || null,
      latestCreatedAt: hotel.activity?.latestCreatedAt || null,
    },
  };
}

// import React, { useContext, useEffect, useRef, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ArrowLeft, ArrowRight, BedDouble, Check, Eye, Flame, Users } from 'lucide-react';
// import { BookingContext } from '../../context/BookingContext';
// import { formatPrice } from '../../data/hotels';
// import DealCountdown from './DealCountdown';

// const createViewerId = () => {
//   const bytes = window.crypto.getRandomValues(new Uint8Array(16));
//   bytes[6] = (bytes[6] & 0x0f) | 0x40;
//   bytes[8] = (bytes[8] & 0x3f) | 0x80;
//   const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
//   return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
// };

// function useRoomViewerCount(roomId) {
//   const cardRef = useRef(null);
//   const [viewerCount, setViewerCount] = useState(null);

//   useEffect(() => {
//     const card = cardRef.current;
//     if (!card || !/^[a-f\d]{24}$/i.test(roomId || '')) return undefined;

//     const viewerId = createViewerId();
//     let stopTracking = null;
//     const startTracking = () => {
//       let active = true;
//       let requestInFlight = false;
//       let interval;
//       const endpoint = `/api/rooms/${roomId}/viewers`;
//       const removeViewer = async () => {
//         try {
//           const response = await fetch(endpoint, {
//             method: 'DELETE',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ viewerId }),
//             keepalive: true,
//           });
//           if (!response.ok) throw new Error(`Room viewer cleanup failed (${response.status}).`);
//         } catch (error) {
//           console.error('Unable to remove room viewer session:', error);
//         }
//       };
//       const heartbeat = async () => {
//         if (!active || requestInFlight) return;
//         requestInFlight = true;
//         try {
//           const response = await fetch(endpoint, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ viewerId }),
//           });
//           if (!response.ok) throw new Error(`Room viewer heartbeat failed (${response.status}).`);
//           const payload = await response.json();
//           if (active && Number.isInteger(payload.count)) setViewerCount(payload.count);
//         } catch (error) {
//           if (active) {
//             setViewerCount(null);
//             console.error('Unable to update room viewer count:', error);
//           }
//         } finally {
//           requestInFlight = false;
//           if (!active) void removeViewer();
//         }
//       };
//       void heartbeat();
//       interval = window.setInterval(heartbeat, 15000);

//       return () => {
//         if (!active) return;
//         active = false;
//         window.clearInterval(interval);
//         setViewerCount(null);
//         if (!requestInFlight) void removeViewer();
//       };
//     };

//     let observer;
//     if (typeof window.IntersectionObserver === 'function') {
//       observer = new window.IntersectionObserver(([entry]) => {
//         if (entry.isIntersecting && !stopTracking) stopTracking = startTracking();
//         else if (!entry.isIntersecting && stopTracking) {
//           stopTracking();
//           stopTracking = null;
//         }
//       }, { threshold: 0.25 });
//       observer.observe(card);
//     } else {
//       stopTracking = startTracking();
//     }

//     return () => {
//       observer?.disconnect();
//       stopTracking?.();
//     };
//   }, [roomId]);

//   return { cardRef, viewerCount };
// }

// const RoomCard = ({ hotel, room, onSelect }) => {
//   const { selectHotel, selectRoom } = useContext(BookingContext);
//   const navigate = useNavigate();
//   const [selectedPackageId, setSelectedPackageId] = useState('');
//   const [imageIndex, setImageIndex] = useState(0);
//   const { cardRef, viewerCount } = useRoomViewerCount(room.id);
//   const packages = room.packages || [];
//   const images = room.images?.length ? room.images : (room.image ? [room.image] : []);
//   const selectedPackage = packages.find((item) => item.id === selectedPackageId);
//   const displayPrice = selectedPackage?.pricePerNight ?? room.price;
//   const displayAmenities = [...new Set([...(room.amenities || []), ...(selectedPackage?.includedAmenities || [])])];
//   const hasDiscount = room.discountPrice !== null && room.discountPrice !== undefined;
//   const hasScarcity = room.availableRoomCount > 0 && room.availableRoomCount <= 3;
//   const hasHighDemand = room.bookingsToday >= 5;

//   const bookRoom = () => {
//     selectHotel(hotel);
//     selectRoom({
//       ...room,
//       price: displayPrice,
//       packageId: selectedPackage?.id || null,
//       packageName: selectedPackage?.name || '',
//       packageDescription: selectedPackage?.description || '',
//     });
//     if (onSelect) onSelect();
//     else navigate('/booking');
//   };

//   return (
//     <article ref={cardRef} className="room-option">
//       {images.length ? <div className="room-card-gallery"><img src={images[imageIndex]} alt={`${room.name} at ${hotel.name}`} loading="lazy" />{images.length > 1 && <div className="room-gallery-controls"><button type="button" aria-label="Previous room image" onClick={() => setImageIndex((index) => (index - 1 + images.length) % images.length)}><ArrowLeft size={13} /></button><span>{imageIndex + 1} / {images.length}</span><button type="button" aria-label="Next room image" onClick={() => setImageIndex((index) => (index + 1) % images.length)}><ArrowRight size={13} /></button></div>}</div> : <div className="room-image-fallback"><BedDouble size={30} /></div>}
//       <div className="room-option-info">
//         <div className="room-option-heading">
//           <div>
//             <p>{[room.size, room.bedType].filter(Boolean).join(' · ')} {room.capacity ? <><span>·</span> <Users size={13} /> Up to {room.capacity} guests</> : null}</p>
//             <h3>{room.name}</h3>
//           </div>
//           <div className="room-option-price">{!selectedPackage && room.discountPrice !== null && room.discountPrice !== undefined && <del>{formatPrice(room.basePrice)}</del>}<strong>{formatPrice(displayPrice)}</strong><span> / night</span></div>
//         </div>
//         {(hasScarcity || hasHighDemand || hasDiscount || viewerCount !== null) && <div className="room-urgency-signals">
//           {hasScarcity && <p className="room-scarcity-badge"><Flame size={14} /> Only {room.availableRoomCount} rooms left at this price!</p>}
//           {hasHighDemand && <p className="room-activity-badge"><Flame size={14} /> High demand · booked {room.bookingsToday} times today</p>}
//           {hasDiscount && <DealCountdown discountPrice={room.discountPrice} />}
//           {viewerCount !== null && <p className="room-viewer-badge"><Eye size={14} /> {viewerCount} people are viewing this room right now</p>}
//         </div>}
//         {room.description && <p className="room-option-description">{room.description}</p>}
//         {packages.length > 0 && <label className="room-package-select">Rate package<select value={selectedPackageId} onChange={(event) => setSelectedPackageId(event.target.value)}><option value="">Base room rate · {formatPrice(room.price)}</option>{packages.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {formatPrice(plan.pricePerNight)}</option>)}</select></label>}
//         {selectedPackage?.description && <p className="room-option-description">{selectedPackage.description}</p>}
//         <div className="room-option-amenities">
//           {displayAmenities.map((amenity) => <span key={amenity}><Check size={13} /> {amenity}</span>)}
//         </div>
//         <button className="button button-primary room-select-button" type="button" onClick={bookRoom}>
//           Select room <ArrowRight size={15} />
//         </button>
//       </div>
//     </article>
//   );
// };

// export default RoomCard;



import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BedDouble, Check, ChevronLeft, ChevronRight, Eye, Flame, Users, X } from 'lucide-react';
import { BookingContext } from '../../context/BookingContext';
import { formatPrice } from '../../data/hotels';
import DealCountdown from './DealCountdown';

const createViewerId = () => {
  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
};

function useRoomViewerCount(roomId) {
  const cardRef = useRef(null);
  const [viewerCount, setViewerCount] = useState(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || !/^[a-f\d]{24}$/i.test(roomId || '')) return undefined;

    const viewerId = createViewerId();
    let stopTracking = null;
    const startTracking = () => {
      let active = true;
      let requestInFlight = false;
      let interval;
      const endpoint = `/api/rooms/${roomId}/viewers`;
      const removeViewer = async () => {
        try {
          const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ viewerId }),
            keepalive: true,
          });
          if (!response.ok) throw new Error(`Room viewer cleanup failed (${response.status}).`);
        } catch (error) {
          console.error('Unable to remove room viewer session:', error);
        }
      };
      const heartbeat = async () => {
        if (!active || requestInFlight) return;
        requestInFlight = true;
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ viewerId }),
          });
          if (!response.ok) throw new Error(`Room viewer heartbeat failed (${response.status}).`);
          const payload = await response.json();
          if (active && Number.isInteger(payload.count)) setViewerCount(payload.count);
        } catch (error) {
          if (active) {
            setViewerCount(null);
            console.error('Unable to update room viewer count:', error);
          }
        } finally {
          requestInFlight = false;
          if (!active) void removeViewer();
        }
      };
      void heartbeat();
      interval = window.setInterval(heartbeat, 15000);

      return () => {
        if (!active) return;
        active = false;
        window.clearInterval(interval);
        setViewerCount(null);
        if (!requestInFlight) void removeViewer();
      };
    };

    let observer;
    if (typeof window.IntersectionObserver === 'function') {
      observer = new window.IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !stopTracking) stopTracking = startTracking();
        else if (!entry.isIntersecting && stopTracking) {
          stopTracking();
          stopTracking = null;
        }
      }, { threshold: 0.25 });
      observer.observe(card);
    } else {
      stopTracking = startTracking();
    }

    return () => {
      observer?.disconnect();
      stopTracking?.();
    };
  }, [roomId]);

  return { cardRef, viewerCount };
}

const RoomCard = ({ hotel, room, onSelect, onOpenGallery }) => {
  const { selectHotel, selectRoom } = useContext(BookingContext);
  const navigate = useNavigate();
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [imageIndex, setImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { cardRef, viewerCount } = useRoomViewerCount(room.id);
  const packages = room.packages || [];
  const images = room.images?.length ? room.images : (room.image ? [room.image] : []);
  const activeIndex = images.length ? imageIndex % images.length : 0;
  const selectedPackage = packages.find((item) => item.id === selectedPackageId);
  const displayPrice = selectedPackage?.pricePerNight ?? room.price;
  const displayAmenities = [...new Set([...(room.amenities || []), ...(selectedPackage?.includedAmenities || [])])];
  const hasDiscount = room.discountPrice !== null && room.discountPrice !== undefined;
  const hasScarcity = room.availableRoomCount > 0 && room.availableRoomCount <= 3;
  const hasHighDemand = room.bookingsToday >= 5;

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setLightboxOpen(false);
      else if (event.key === 'ArrowLeft' && images.length > 1) {
        setImageIndex((index) => (index - 1 + images.length) % images.length);
      } else if (event.key === 'ArrowRight' && images.length > 1) {
        setImageIndex((index) => (index + 1) % images.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, images.length]);

  const handlePrevImage = (event) => {
    event?.stopPropagation();
    if (!images.length) return;
    setImageIndex((index) => (index - 1 + images.length) % images.length);
  };

  const handleNextImage = (event) => {
    event?.stopPropagation();
    if (!images.length) return;
    setImageIndex((index) => (index + 1) % images.length);
  };

  const openRoomLightbox = (event) => {
    event?.stopPropagation();
    if (typeof onOpenGallery === 'function') {
      onOpenGallery(room, activeIndex);
      return;
    }
    if (images.length) setLightboxOpen(true);
  };

  const bookRoom = () => {
    selectHotel(hotel);
    selectRoom({
      ...room,
      price: displayPrice,
      packageId: selectedPackage?.id || null,
      packageName: selectedPackage?.name || '',
      packageDescription: selectedPackage?.description || '',
    });
    if (onSelect) onSelect();
    else navigate('/booking');
  };

  return (
    <>
      <article ref={cardRef} className="room-option">
        {images.length ? (
          <div className="room-card-gallery">
            <img
              src={images[activeIndex]}
              alt={`${room.name} at ${hotel.name}`}
              loading="lazy"
              className="room-gallery-clickable"
              onClick={openRoomLightbox}
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="room-gallery-arrow room-gallery-prev"
                  aria-label="Previous room image"
                  onClick={handlePrevImage}
                >
                  <ChevronLeft size={22} strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  className="room-gallery-arrow room-gallery-next"
                  aria-label="Next room image"
                  onClick={handleNextImage}
                >
                  <ChevronRight size={22} strokeWidth={2.2} />
                </button>
              </>
            )}
            <button
              type="button"
              className="room-photos-badge"
              aria-label={`View all ${images.length} photos of ${room.name}`}
              onClick={openRoomLightbox}
            >
              <span>{images.length} PHOTOS</span>
              <ArrowRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <div className="room-image-fallback"><BedDouble size={30} /></div>
        )}
        <div className="room-option-info">
          <div className="room-option-heading">
            <div>
              <p>{[room.size, room.bedType].filter(Boolean).join(' · ')} {room.capacity ? <><span>·</span> <Users size={13} /> Up to {room.capacity} guests</> : null}</p>
              <h3>{room.name}</h3>
            </div>
            <div className="room-option-price">{!selectedPackage && room.discountPrice !== null && room.discountPrice !== undefined && <del>{formatPrice(room.basePrice)}</del>}<strong>{formatPrice(displayPrice)}</strong><span> / night</span></div>
          </div>
          {(hasScarcity || hasHighDemand || hasDiscount || viewerCount !== null) && <div className="room-urgency-signals">
            {hasScarcity && <p className="room-scarcity-badge"><Flame size={14} /> Only {room.availableRoomCount} rooms left at this price!</p>}
            {hasHighDemand && <p className="room-activity-badge"><Flame size={14} /> High demand · booked {room.bookingsToday} times today</p>}
            {hasDiscount && <DealCountdown discountPrice={room.discountPrice} />}
            {viewerCount !== null && <p className="room-viewer-badge"><Eye size={14} /> {viewerCount} people are viewing this room right now</p>}
          </div>}
          {room.description && <p className="room-option-description">{room.description}</p>}
          {packages.length > 0 && <label className="room-package-select">Rate package<select value={selectedPackageId} onChange={(event) => setSelectedPackageId(event.target.value)}><option value="">Base room rate · {formatPrice(room.price)}</option>{packages.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {formatPrice(plan.pricePerNight)}</option>)}</select></label>}
          {selectedPackage?.description && <p className="room-option-description">{selectedPackage.description}</p>}
          <div className="room-option-amenities">
            {displayAmenities.map((amenity) => <span key={amenity}><Check size={13} /> {amenity}</span>)}
          </div>
          <button className="button button-primary room-select-button" type="button" onClick={bookRoom}>
            Select room <ArrowRight size={15} />
          </button>
        </div>
      </article>

      {lightboxOpen && images.length > 0 && (
        <div
          className="room-lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={room.name}
          onClick={() => setLightboxOpen(false)}
        >
          <div className="room-lightbox-frame" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="room-lightbox-close"
              aria-label="Close room photos"
              onClick={() => setLightboxOpen(false)}
            >
              <X size={16} strokeWidth={2.5} />
            </button>
            <div className="room-lightbox-card">
              <div className="room-lightbox-header">
                <h3>{room.name}</h3>
              </div>
              <div className="room-lightbox-stage">
                {images.length > 1 && (
                  <button
                    type="button"
                    className="room-lightbox-arrow room-lightbox-prev"
                    aria-label="Previous room photo"
                    onClick={handlePrevImage}
                  >
                    <ChevronLeft size={34} strokeWidth={1.6} />
                  </button>
                )}
                <img
                  src={images[activeIndex]}
                  alt={`${room.name} photo ${activeIndex + 1} of ${images.length}`}
                />
                {images.length > 1 && (
                  <button
                    type="button"
                    className="room-lightbox-arrow room-lightbox-next"
                    aria-label="Next room photo"
                    onClick={handleNextImage}
                  >
                    <ChevronRight size={34} strokeWidth={1.6} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoomCard;
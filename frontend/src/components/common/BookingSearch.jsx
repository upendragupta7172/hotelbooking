import React, { useContext, useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, ChevronDown, MapPin, Minus, Plus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BookingContext } from '../../context/BookingContext';

const today = new Date().toISOString().slice(0, 10);

const BookingSearch = ({ compact = false }) => {
  const { searchParams, updateSearch } = useContext(BookingContext);
  const navigate = useNavigate();
  const [destination, setDestination] = useState(searchParams.destination || 'Any destination');
  const [destinationOptions, setDestinationOptions] = useState([]);
  const [checkIn, setCheckIn] = useState(searchParams.checkIn || '');
  const [checkOut, setCheckOut] = useState(searchParams.checkOut || '');
  const [adults, setAdults] = useState(searchParams.adults || searchParams.guests || 2);
  const [rooms, setRooms] = useState(searchParams.rooms || 1);
  const [guestOpen, setGuestOpen] = useState(false);
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/hotels')
      .then((res) => res.ok ? res.json() : [])
      .then((hotels) => {
        if (!active || !Array.isArray(hotels)) return;
        setDestinationOptions([...new Set(hotels.flatMap((hotel) => [hotel.city, hotel.country]).filter(Boolean))].sort());
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setDestination(searchParams.destination || 'Any destination');
  }, [searchParams.destination]);

  const submitSearch = (event) => {
    event.preventDefault();
    if (checkIn && checkOut && checkOut <= checkIn) {
      setDateError('Check-out must be after check-in.');
      return;
    }

    setDateError('');
    updateSearch({ destination, checkIn, checkOut, guests: adults, adults, rooms });
    navigate('/hotels');
  };

  return (
    <form className={`booking-search booking-search-v2 ${compact ? 'booking-search-compact' : ''}`} onSubmit={submitSearch}>
      <label className="search-field destination-field">
        <span className="field-label">DESTINATION</span>
        <span className="field-control">
          <MapPin size={16} aria-hidden="true" />
          <select aria-label="Destination" value={destination} onChange={(event) => setDestination(event.target.value)}>
            <option value="Any destination">Any destination</option>
            {destination && destination !== 'Any destination' && !destinationOptions.includes(destination) && <option value={destination}>{destination}</option>}
            {destinationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <ChevronDown size={14} aria-hidden="true" />
        </span>
      </label>
      <label className="search-field">
        <span className="field-label">CHECK IN</span>
        <span className="field-control date-control"><CalendarDays size={15} aria-hidden="true" />
          <input aria-label="Check-in date" type="date" min={today} value={checkIn} onChange={(event) => setCheckIn(event.target.value)} />
        </span>
      </label>
      <label className="search-field">
        <span className="field-label">CHECK OUT</span>
        <span className="field-control date-control"><CalendarDays size={15} aria-hidden="true" />
          <input aria-label="Check-out date" type="date" min={checkIn || today} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} />
        </span>
      </label>
      <div className="search-field guests-field">
        <span className="field-label">GUESTS & ROOMS</span>
        <button className="guest-toggle" type="button" aria-expanded={guestOpen} onClick={() => setGuestOpen(!guestOpen)}>
          <Users size={15} aria-hidden="true" /> {adults} guests, {rooms} {rooms === 1 ? 'room' : 'rooms'} <ChevronDown size={14} />
        </button>
        {guestOpen && (
          <div className="guest-picker">
            <div className="guest-row"><span>Adults</span><GuestStepper value={adults} min={1} max={8} onChange={setAdults} /></div>
            <div className="guest-row"><span>Rooms</span><GuestStepper value={rooms} min={1} max={5} onChange={setRooms} /></div>
            <button type="button" className="guest-done" onClick={() => setGuestOpen(false)}>Done</button>
          </div>
        )}
      </div>
      <button className="search-submit" type="submit">Search stays <ArrowRight size={16} /></button>
      {dateError && <p className="search-error" role="alert">{dateError}</p>}
    </form>
  );
};

function GuestStepper({ value, min, max, onChange }) {
  return (
    <div className="guest-stepper">
      <button type="button" aria-label="Decrease" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}><Minus size={13} /></button>
      <span>{value}</span>
      <button type="button" aria-label="Increase" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}><Plus size={13} /></button>
    </div>
  );
}

export default BookingSearch;

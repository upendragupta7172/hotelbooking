export const getNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 1;
  const [startYear, startMonth, startDay] = checkIn.split('-').map(Number);
  const [endYear, endMonth, endDay] = checkOut.split('-').map(Number);
  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);
  const nights = Math.round((end - start) / 86400000);
  return Number.isFinite(nights) && nights > 0 ? nights : 1;
};

export const getBookingPrice = (room, searchParams = {}) => {
  const nights = getNights(searchParams.checkIn, searchParams.checkOut);
  const roomCount = Math.max(1, Number(searchParams.rooms) || 1);
  const subtotal = (Number(room?.price) || 0) * nights * roomCount;
  const taxes = Math.round(subtotal * 0.12);

  return { nights, roomCount, subtotal, taxes, total: subtotal + taxes };
};

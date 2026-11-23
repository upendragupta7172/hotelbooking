const overlaps = (start, end, blockStart, blockEnd) =>
  !(new Date(end) <= new Date(blockStart) || new Date(start) >= new Date(blockEnd));

const isUnavailable = (room, start, end, now = new Date()) => {
  if (room.status === 'Inactive' || room.status === 'Cleaning') return true;

  if (room.status === 'Occupied' && new Date(start) <= now && new Date(end) > now) return true;

  if (room.status === 'Maintenance' && !(room.maintenancePeriods || []).length) return true;

  const hasMaintenanceConflict = (room.maintenancePeriods || []).some((period) =>
    overlaps(start, end, period.start, period.end)
  );
  if (hasMaintenanceConflict) return true;

  return (room.bookings || []).some((booking) =>
    overlaps(start, end, booking.start, booking.end)
  );
};

module.exports = { isUnavailable };

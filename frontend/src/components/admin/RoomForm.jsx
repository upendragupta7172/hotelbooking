import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';

const objectId = (value) => value && typeof value === 'object' ? value._id : value || '';
const emptyPackage = () => ({ name: '', description: '', pricePerNight: '', includedAmenities: [] });
const roomStatuses = ['Available', 'Occupied', 'Maintenance', 'Cleaning', 'Inactive'];

const RoomForm = ({ initialData, hotels, categories, amenities, onClose, onSave, onCreateCategory, onCreateAmenity, onUploadImage }) => {
  const [form, setForm] = useState({ hotel: '', roomNumber: '', type: '', image: '', images: [], videos: [], description: '', capacity: 2, size: '', bedType: '', category: '', pricePerNight: '', discountPrice: '', amenities: [], packages: [], status: 'Available', maintenancePeriods: [] });
  const [newImages, setNewImages] = useState([]);
  const [imageError, setImageError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [showCategoryEntry, setShowCategoryEntry] = useState(categories.length === 0);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [amenityName, setAmenityName] = useState('');
  const [showAmenityEntry, setShowAmenityEntry] = useState(amenities.length === 0);
  const [creatingAmenity, setCreatingAmenity] = useState(false);
  const [maintenanceStart, setMaintenanceStart] = useState('');
  const [maintenanceEnd, setMaintenanceEnd] = useState('');
  const [maintenanceReason, setMaintenanceReason] = useState('');

  useEffect(() => {
    if (!initialData) return;
    const periods = initialData.maintenancePeriods || [];
    const latestPeriod = periods.at(-1);
    setForm({
      hotel: objectId(initialData.hotel), roomNumber: initialData.roomNumber || '', type: initialData.type || initialData.name || '',
      image: initialData.image || '', images: initialData.images?.length ? initialData.images : (initialData.image ? [initialData.image] : []), videos: initialData.videos || [],
      description: initialData.description || '', capacity: initialData.capacity ?? 2, size: initialData.size || '',
      bedType: initialData.bedType || '', category: objectId(initialData.category), pricePerNight: initialData.pricePerNight ?? '',
      discountPrice: initialData.discountPrice ?? '', amenities: (initialData.amenities || []).map(objectId),
      packages: (initialData.packages || []).map((plan) => ({
        name: plan.name || '', description: plan.description || '', pricePerNight: plan.pricePerNight ?? '',
        includedAmenities: (plan.includedAmenities || []).map(objectId),
      })),
      status: initialData.status || 'Available', maintenancePeriods: periods,
    });
    if (latestPeriod) {
      setMaintenanceStart(new Date(latestPeriod.start).toISOString().slice(0, 10));
      setMaintenanceEnd(new Date(latestPeriod.end).toISOString().slice(0, 10));
      setMaintenanceReason(latestPeriod.reason || '');
    }
  }, [initialData]);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const toggleAmenity = (id) => setForm((current) => ({ ...current, amenities: current.amenities.includes(id) ? current.amenities.filter((item) => item !== id) : [...current.amenities, id] }));
  const togglePackageAmenity = (index, id) => setForm((current) => ({
    ...current,
    packages: current.packages.map((plan, planIndex) => planIndex !== index ? plan : {
      ...plan,
      includedAmenities: plan.includedAmenities.includes(id) ? plan.includedAmenities.filter((item) => item !== id) : [...plan.includedAmenities, id],
    }),
  }));
  const updatePackage = (index, key, value) => setForm((current) => ({
    ...current,
    packages: current.packages.map((plan, planIndex) => planIndex === index ? { ...plan, [key]: value } : plan),
  }));

  const chooseImages = (event) => {
    const files = [...(event.target.files || [])];
    event.target.value = '';
    setImageError('');
    const accepted = files.filter((file) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) && file.size <= 5 * 1024 * 1024);
    if (accepted.length !== files.length) setImageError('Select JPG, PNG, WEBP, or GIF images under 5 MB each.');
    const roomLeft = Math.max(0, 10 - form.images.length - newImages.length);
    if (accepted.length > roomLeft) setImageError('A room can have up to 10 images.');
    setNewImages((current) => [...current, ...accepted.slice(0, roomLeft).map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
  };

  const saveCategory = async () => {
    if (!categoryName.trim()) return setError('Enter a category name first.');
    setCreatingCategory(true); setError('');
    try {
      const category = await onCreateCategory({ name: categoryName.trim() });
      setForm((current) => ({ ...current, category: category._id }));
      setCategoryName(''); setShowCategoryEntry(false);
    } catch (err) { setError(err.message || 'Could not create category.'); }
    finally { setCreatingCategory(false); }
  };

  const saveAmenity = async () => {
    if (!amenityName.trim()) return setError('Enter an amenity name first.');
    setCreatingAmenity(true); setError('');
    try {
      const amenity = await onCreateAmenity({ name: amenityName.trim() });
      setForm((current) => ({ ...current, amenities: [...new Set([...current.amenities, amenity._id])] }));
      setAmenityName(''); setShowAmenityEntry(false);
    } catch (err) { setError(err.message || 'Could not create amenity.'); }
    finally { setCreatingAmenity(false); }
  };

  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError('');
    try {
      let uploadedUrls = [];
      if (newImages.length) {
        if (!onUploadImage) throw new Error('Image upload is unavailable.');
        setUploading(true);
        for (const item of newImages) {
          const result = await onUploadImage(item.file);
          uploadedUrls.push(result.url);
        }
        setUploading(false);
      }
      const images = [...form.images, ...uploadedUrls];
      let maintenancePeriods = form.maintenancePeriods.filter((period) => period.start && period.end);
      if ((maintenanceStart && !maintenanceEnd) || (!maintenanceStart && maintenanceEnd)) throw new Error('Enter both maintenance start and end dates, or leave both empty.');
      if (maintenanceStart && maintenanceEnd && maintenanceEnd <= maintenanceStart) throw new Error('Maintenance end date must be after the start date.');
      if (form.status === 'Maintenance') {
        if (initialData && maintenancePeriods.length) maintenancePeriods = maintenancePeriods.slice(0, -1);
        if (maintenanceStart && maintenanceEnd) maintenancePeriods.push({ start: maintenanceStart, end: maintenanceEnd, reason: maintenanceReason });
        else maintenancePeriods = [];
      }
      const payload = {
        ...form,
        videos: form.videos.filter(Boolean),
        name: form.type.trim(),
        category: form.category || null,
        image: images[0] || '',
        images,
        pricePerNight: Number(form.pricePerNight),
        discountPrice: form.discountPrice === '' ? null : Number(form.discountPrice),
        capacity: Number(form.capacity),
        maintenancePeriods,
        packages: form.packages.map((plan) => ({ ...plan, pricePerNight: Number(plan.pricePerNight) })),
      };
      if (initialData) await onSave(initialData._id, payload);
      else await onSave(payload);
      newImages.forEach((item) => URL.revokeObjectURL(item.preview));
      onClose();
    } catch (err) { setError(err.message || 'Could not save room.'); }
    finally { setUploading(false); setLoading(false); }
  };

  const removeNewImage = (index) => setNewImages((current) => {
    const item = current[index];
    if (item) URL.revokeObjectURL(item.preview);
    return current.filter((_, itemIndex) => itemIndex !== index);
  });

  return <Modal onClose={onClose} title={initialData ? 'Edit room' : 'Add room'}>
    <form className="admin-form room-form" onSubmit={submit}>
      {error && <p className="admin-form-error room-form-wide">{error}</p>}
      <label>Hotel<select name="hotel" value={form.hotel} onChange={change} required><option value="">Choose hotel</option>{hotels.map((hotel) => <option key={hotel._id} value={hotel._id}>{hotel.name} · {hotel.city}</option>)}</select></label>
      <label>Room number<input name="roomNumber" value={form.roomNumber} onChange={change} required /></label>
      <label>Room type<input name="type" value={form.type} onChange={change} required /></label>
      <label>Category<select name="category" value={form.category} onChange={change}><option value="">{categories.length ? 'No category' : 'No categories yet'}</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select></label>
      <div className="room-create-control">
        {showCategoryEntry ? <div className="room-category-entry"><input aria-label="New category name" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="New category name" /><button type="button" onClick={saveCategory} disabled={creatingCategory || !categoryName.trim()}>{creatingCategory ? 'Adding…' : 'Add category'}</button></div> : <button type="button" className="room-inline-link" onClick={() => setShowCategoryEntry(true)}>+ Add category</button>}
      </div>
      <label>Base price per night<input name="pricePerNight" type="number" min="0" value={form.pricePerNight} onChange={change} required /></label>
      <label>Discount price<input name="discountPrice" type="number" min="0" max={form.pricePerNight || undefined} value={form.discountPrice} onChange={change} /></label>
      <label>Maximum guests<input name="capacity" type="number" min="1" step="1" value={form.capacity} onChange={change} required /></label>
      <label>Bed type<input name="bedType" value={form.bedType} onChange={change} /></label>
      <label>Room size<input name="size" value={form.size} onChange={change} /></label>
      <label>Room status<select name="status" value={form.status} onChange={change}>{roomStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
      <label className="room-form-wide">Room description<textarea name="description" rows="3" value={form.description} onChange={change} /></label>

      {form.status === 'Maintenance' && <fieldset className="room-maintenance room-form-wide"><legend>Maintenance period</legend><p>Bookings overlapping this period will be blocked. Leave dates empty only for indefinite maintenance.</p><div><label>Starts<input type="date" value={maintenanceStart} onChange={(event) => setMaintenanceStart(event.target.value)} /></label><label>Ends<input type="date" value={maintenanceEnd} onChange={(event) => setMaintenanceEnd(event.target.value)} /></label></div><label>Reason<input value={maintenanceReason} onChange={(event) => setMaintenanceReason(event.target.value)} /></label></fieldset>}

      <section className="room-images-control room-form-wide"><label>Room images<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={chooseImages} /></label><small>Upload up to 10 images, maximum 5 MB each.</small>{imageError && <p className="admin-form-error">{imageError}</p>}<div className="room-image-grid">{form.images.map((image, index) => <figure key={`${image}-${index}`}><img src={image} alt={`Room ${index + 1}`} /><button type="button" onClick={() => setForm((current) => ({ ...current, images: current.images.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</button></figure>)}{newImages.map((item, index) => <figure key={item.preview}><img src={item.preview} alt={item.file.name} /><button type="button" onClick={() => removeNewImage(index)}>Remove</button></figure>)}</div></section>
      <label className="room-form-wide">Direct video URLs, comma separated<input name="videos" value={form.videos.join(', ')} onChange={(event) => setForm((current) => ({ ...current, videos: event.target.value.split(',').map((url) => url.trim()) }))} placeholder="https://…/room-tour.mp4" /><small>Use direct MP4, WebM, or OGG links. Up to 10 videos.</small></label>

      <fieldset className="admin-amenity-options room-form-wide">
        <legend>Room facilities</legend>
        {amenities.map((amenity) => <label key={amenity._id}><input type="checkbox" checked={form.amenities.includes(amenity._id)} onChange={() => toggleAmenity(amenity._id)} />{amenity.name}</label>)}
        {amenities.length === 0 && <span className="admin-form-hint">No facilities saved yet. Add one below; it will be selected for this room.</span>}
        <div className="room-create-control room-form-wide">
          {showAmenityEntry ? <div className="room-category-entry"><input aria-label="New facility name" value={amenityName} onChange={(event) => setAmenityName(event.target.value)} placeholder="New facility name" /><button type="button" onClick={saveAmenity} disabled={creatingAmenity || !amenityName.trim()}>{creatingAmenity ? 'Adding…' : 'Add and select'}</button></div> : <button type="button" className="room-inline-link" onClick={() => setShowAmenityEntry(true)}>+ Add facility</button>}
        </div>
      </fieldset>

      <section className="room-packages room-form-wide">
        <div className="room-packages-heading"><div><strong>Rate packages</strong><p>Add optional prices and inclusions for this room.</p></div><button type="button" className="room-inline-link" onClick={() => setForm((current) => ({ ...current, packages: [...current.packages, emptyPackage()] }))}>+ Add package</button></div>
        {form.packages.map((plan, index) => <fieldset className="room-package-card" key={index}>
          <div className="room-package-heading"><strong>Package {index + 1}</strong><button type="button" className="room-inline-link room-remove-package" onClick={() => setForm((current) => ({ ...current, packages: current.packages.filter((_, planIndex) => planIndex !== index) }))}>Remove</button></div>
          <label>Package name<input value={plan.name} onChange={(event) => updatePackage(index, 'name', event.target.value)} required /></label>
          <label>Price per night<input type="number" min="0" value={plan.pricePerNight} onChange={(event) => updatePackage(index, 'pricePerNight', event.target.value)} required /></label>
          <label>Package details<input value={plan.description} onChange={(event) => updatePackage(index, 'description', event.target.value)} /></label>
          <div className="package-inclusions"><span>Included facilities</span>{amenities.map((amenity) => <label key={amenity._id}><input type="checkbox" checked={plan.includedAmenities.includes(amenity._id)} onChange={() => togglePackageAmenity(index, amenity._id)} />{amenity.name}</label>)}{amenities.length === 0 && <small>Create facilities above to add package inclusions.</small>}</div>
        </fieldset>)}
      </section>

      <div className="modal-actions room-form-wide"><button type="button" className="admin-secondary" onClick={onClose} disabled={loading}>Cancel</button><button type="submit" disabled={loading || uploading || hotels.length === 0}>{uploading ? 'Uploading images…' : loading ? 'Saving…' : 'Save room'}</button></div>
      {hotels.length === 0 && <p className="admin-form-hint room-form-wide">Add a hotel before creating a room.</p>}
    </form>
  </Modal>;
};

export default RoomForm;

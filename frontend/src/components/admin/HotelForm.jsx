import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';

const HotelForm = ({ initialData, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: '', address: '', city: '', country: '', location: '', description: '',
    propertyType: '', rating: '', starCategory: '3', pricePerNight: '',
    amenities: '', images: [''], videos: [''],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialData) return;
    setForm({
      name: initialData.name || '',
      address: initialData.address || '',
      city: initialData.city || '',
      country: initialData.country || '',
      location: initialData.location || '',
      description: initialData.description || '',
      propertyType: initialData.propertyType || '',
      rating: initialData.rating ?? '',
      starCategory: initialData.starCategory ?? '3',
      pricePerNight: initialData.pricePerNight ?? '',
      amenities: Array.isArray(initialData.amenities) ? initialData.amenities.join(', ') : '',
      images: Array.isArray(initialData.images) && initialData.images.length > 0 ? initialData.images : [''],
      videos: Array.isArray(initialData.videos) && initialData.videos.length > 0 ? initialData.videos : [''],
    });
  }, [initialData]);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  // --- URL list helpers ---
  const setUrlList = (field, index, value) => {
    setForm((current) => {
      const list = [...current[field]];
      list[index] = value;
      return { ...current, [field]: list };
    });
  };
  const addUrl = (field) => setForm((current) => ({ ...current, [field]: [...current[field], ''] }));
  const removeUrl = (field, index) => {
    setForm((current) => {
      const list = current[field].filter((_, i) => i !== index);
      return { ...current, [field]: list.length > 0 ? list : [''] };
    });
  };

  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError('');
    const payload = {
      ...form,
      rating: form.rating === '' ? 0 : Number(form.rating),
      starCategory: Number(form.starCategory),
      pricePerNight: Number(form.pricePerNight || 0),
      amenities: form.amenities.split(',').map((item) => item.trim()).filter(Boolean),
      images: form.images.filter(Boolean),
      videos: form.videos.filter(Boolean),
    };
    try {
      if (initialData) await onSave(initialData._id, payload);
      else await onSave(payload);
      onClose();
    } catch (err) { setError(err.message || 'Could not save hotel.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal onClose={onClose} title={initialData ? 'Edit hotel' : 'Add hotel'}>
      <form className="admin-form admin-form-grid" onSubmit={submit}>
        {error && <p className="admin-form-error">{error}</p>}
        <label>Hotel name<input name="name" value={form.name} onChange={change} required /></label>
        <label>Property type<input name="propertyType" value={form.propertyType} onChange={change} placeholder="Hotel, resort, guesthouse" /></label>
        <label>Address<input name="address" value={form.address} onChange={change} required /></label>
        <label>City<input name="city" value={form.city} onChange={change} required /></label>
        <label>Country<input name="country" value={form.country} onChange={change} required /></label>
        <label>Location / map link<input name="location" value={form.location} onChange={change} /></label>
        <label>Star category
          <select name="starCategory" value={form.starCategory} onChange={change}>
            {[1, 2, 3, 4, 5].map((star) => <option key={star} value={star}>{star} star</option>)}
          </select>
        </label>
        <label>Nightly starting price<input name="pricePerNight" type="number" min="0" value={form.pricePerNight} onChange={change} required /></label>
        <label>Rating<input name="rating" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={change} /></label>
        <label className="admin-form-wide">Description<textarea name="description" rows="3" value={form.description} onChange={change} /></label>
        <label className="admin-form-wide">Amenities, comma separated<input name="amenities" value={form.amenities} onChange={change} /></label>

        {/* Image URLs */}
        <div className="admin-form-wide">
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Image URLs</label>
          {form.images.map((url, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <input
                type="url"
                value={url}
                placeholder="https://…"
                style={{ flex: 1 }}
                onChange={(e) => setUrlList('images', index, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeUrl('images', index)}
                title="Remove image URL"
                style={{ flex: 'none', padding: '4px 10px', background: 'transparent', border: '1px solid #c9342b', color: '#c9342b', cursor: 'pointer', fontSize: '15px', lineHeight: 1 }}
                aria-label={`Remove image URL ${index + 1}`}
              >×</button>
            </div>
          ))}
          <button
            type="button"
            className="admin-secondary"
            style={{ marginTop: '2px' }}
            onClick={() => addUrl('images')}
          >+ Add image URL</button>
        </div>

        {/* Video URLs */}
        <div className="admin-form-wide">
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Video URLs</label>
          {form.videos.map((url, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <input
                type="url"
                value={url}
                placeholder="https://…"
                style={{ flex: 1 }}
                onChange={(e) => setUrlList('videos', index, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeUrl('videos', index)}
                title="Remove video URL"
                style={{ flex: 'none', padding: '4px 10px', background: 'transparent', border: '1px solid #c9342b', color: '#c9342b', cursor: 'pointer', fontSize: '15px', lineHeight: 1 }}
                aria-label={`Remove video URL ${index + 1}`}
              >×</button>
            </div>
          ))}
          <button
            type="button"
            className="admin-secondary"
            style={{ marginTop: '2px' }}
            onClick={() => addUrl('videos')}
          >+ Add video URL</button>
          <small style={{ display: 'block', marginTop: '6px', color: '#596d76' }}>
            Supports MP4/WebM/OGG direct links, YouTube watch/embed links, and Vimeo links.
          </small>
        </div>

        <div className="modal-actions admin-form-wide">
          <button type="button" className="admin-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save hotel'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default HotelForm;

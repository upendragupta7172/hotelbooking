// src/components/admin/AmenityForm.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

const AmenityForm = ({ initialData = null, onClose, onSave }) => {
  const [form, setForm] = useState({ name: '', icon: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        icon: initialData.icon || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData) {
        await onSave(initialData._id, form);
      } else {
        await onSave(form);
      }
      onClose();
    } catch (err) {
      alert('Error saving amenity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title={initialData ? 'Edit Amenity' : 'Add Amenity'}>
      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Icon (URL or class name)
          <input name="icon" value={form.icon} onChange={handleChange} />
        </label>
        <div className="modal-actions">
          <button type="button" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" disabled={loading}> {loading ? 'Saving…' : 'Save'} </button>
        </div>
      </form>
    </Modal>
  );
};

export default AmenityForm;

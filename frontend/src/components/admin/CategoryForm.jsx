// src/components/admin/CategoryForm.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

const CategoryForm = ({ initialData = null, onClose, onSave }) => {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        description: initialData.description || '',
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
      alert('Error saving category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title={initialData ? 'Edit Category' : 'Add Category'}>
      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Description
          <textarea name="description" value={form.description} onChange={handleChange} required />
        </label>
        <div className="modal-actions">
          <button type="button" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" disabled={loading}> {loading ? 'Saving…' : 'Save'} </button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryForm;

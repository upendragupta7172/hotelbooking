import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import Modal from '../common/Modal';
import './FoodOrdersManagement.css';

const blank = { name: '', category: '', price: '', description: '', image: '', available: true };
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);

export default function HotelMenuManager({ hotel, onClose, onUpdated }) {
  const [menu, setMenu] = useState(hotel.menu || []);
  const [categories, setCategories] = useState(hotel.menuCategories || []);
  const [form, setForm] = useState(blank);
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState('');
  const [editing, setEditing] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    api.get(`/api/admin/hotels/${hotel._id}/menu`).then((data) => { if (active) { setMenu(data.menu || []); setCategories(data.categories || []); } }).catch((err) => { if (active) setError(err.message || 'Could not load menu categories.'); });
    return () => { active = false; };
  }, [hotel._id]);
  const saveCategory = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { name: categoryName };
      const oldName = categories.find((item) => item._id === editingCategory)?.name;
      const result = editingCategory ? await api.put(`/api/admin/hotels/${hotel._id}/menu-categories/${editingCategory}`, payload) : await api.post(`/api/admin/hotels/${hotel._id}/menu-categories`, payload);
      const next = editingCategory ? categories.map((item) => item._id === editingCategory ? result : item) : [...categories, result];
      setCategories(next);
      if (editingCategory && oldName) setMenu((items) => items.map((item) => item.category.toLowerCase() === oldName.toLowerCase() ? { ...item, category: result.name } : item));
      if (!form.category) setForm((current) => ({ ...current, category: result.name }));
      onUpdated?.(menu, next);
      setCategoryName(''); setEditingCategory('');
    } catch (err) { setError(err.message || 'Could not save this category.'); }
    finally { setSaving(false); }
  };
  const deleteCategory = async (category) => {
    try { await api.delete(`/api/admin/hotels/${hotel._id}/menu-categories/${category._id}`); const next = categories.filter((item) => item._id !== category._id); setCategories(next); onUpdated?.(menu, next); if (form.category === category.name) setForm((current) => ({ ...current, category: '' })); }
    catch (err) { setError(err.message || 'Could not delete this category.'); }
  };
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, price: Number(form.price) };
      const result = editing ? await api.put(`/api/admin/hotels/${hotel._id}/menu/${editing}`, payload) : await api.post(`/api/admin/hotels/${hotel._id}/menu`, payload);
      const next = editing ? menu.map((item) => item._id === editing ? result : item) : [...menu, result];
      setMenu(next); onUpdated?.(next, categories); setForm({ ...blank, category: categories[0]?.name || '' }); setEditing('');
    } catch (err) { setError(err.message || 'Could not save this dish.'); }
    finally { setSaving(false); }
  };
  const edit = (item) => { setEditing(item._id); setForm({ name: item.name || '', category: item.category, price: item.price, description: item.description || '', image: item.image || '', available: item.available }); setError(''); };
  const remove = async (item) => {
    if (!window.confirm(`Delete ${item.name} from this hotel's menu?`)) return;
    try { await api.delete(`/api/admin/hotels/${hotel._id}/menu/${item._id}`); const next = menu.filter((entry) => entry._id !== item._id); setMenu(next); onUpdated?.(next, categories); }
    catch (err) { setError(err.message || 'Could not delete this dish.'); }
  };
  return <Modal onClose={onClose} title={`Room service menu · ${hotel.name}`}>
    <div className="admin-menu-manager">
      <p className="admin-form-hint">Create the dishes and prices guests can order during their stay. No dishes are preloaded.</p>
      {error && <p className="admin-form-error">{error}</p>}
      {menu.length ? <div className="admin-menu-list">{menu.map((item) => <article key={item._id}>
        {item.image ? <img src={item.image} alt="" /> : <span className="menu-image-placeholder">{item.category}</span>}
        <div><strong>{item.name}</strong><small>{item.category} · {money(item.price)} · {item.available ? 'Available' : 'Unavailable'}</small></div>
        <button type="button" className="icon-action" onClick={() => edit(item)}>Edit</button><button type="button" className="icon-action danger" onClick={() => remove(item)}>Delete</button>
      </article>)}</div> : <p className="admin-menu-empty">There are no dishes in this hotel's menu yet.</p>}
      <form className="admin-form admin-form-grid admin-menu-form" onSubmit={save}>
        <h3 className="admin-form-wide">{editing ? 'Edit dish' : 'Add a dish'}</h3>
        <label>Dish name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label>Category<select required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="">{categories.length ? 'Choose category' : 'Add a category below first'}</option>{categories.map((category) => <option key={category._id} value={category.name}>{category.name}</option>)}</select></label>
        <label>Price (INR)<input type="number" min="0" step="0.01" required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
        <label>Image URL<input type="url" placeholder="https://…" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} /></label>
        <label className="admin-form-wide">Description<textarea rows="2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <label className="admin-menu-availability"><input type="checkbox" checked={form.available} onChange={(event) => setForm({ ...form, available: event.target.checked })} /> Available to order</label>
        <div className="modal-actions admin-form-wide"><button className="admin-secondary" type="button" onClick={() => { setEditing(''); setForm({ ...blank, category: categories[0]?.name || '' }); }}>Clear</button><button type="submit" disabled={saving || !categories.length}>{saving ? 'Saving…' : editing ? 'Update dish' : 'Add dish'}</button></div>
      </form>
      <section className="admin-menu-categories"><h3>Menu categories</h3><p className="admin-form-hint">Add categories for this hotel's food menu, then assign each dish to one.</p>
        {categories.length ? <div className="admin-menu-category-list">{categories.map((category) => <div key={category._id}><strong>{category.name}</strong><button type="button" className="icon-action" onClick={() => { setEditingCategory(category._id); setCategoryName(category.name); }}>Rename</button><button type="button" className="icon-action danger" onClick={() => deleteCategory(category)}>Delete</button></div>)}</div> : <p className="admin-menu-empty">No categories added for this hotel.</p>}
        <form className="admin-menu-category-form" onSubmit={saveCategory}><label>{editingCategory ? 'Rename category' : 'New category'}<input required maxLength="40" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="e.g. Breakfast, Beverages, Desserts" /></label><button type="submit" disabled={saving}>{saving ? 'Saving…' : editingCategory ? 'Save name' : 'Add category'}</button>{editingCategory && <button type="button" className="admin-secondary" onClick={() => { setEditingCategory(''); setCategoryName(''); }}>Cancel</button>}</form>
      </section>
    </div>
  </Modal>;
}

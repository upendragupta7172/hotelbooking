// src/components/common/Modal.jsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

const Modal = ({ onClose, title, children }) => {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </header>
        <section className="modal-body">{children}</section>
      </div>
    </div>,
    document.body
  );
};

export default Modal;

// src/components/common/Button.jsx
import React from 'react';

const Button = ({ children, onClick, type = 'button', variant = 'primary', className = '' }) => {
  const baseClasses = 'px-5 py-2 rounded-md font-medium transition-colors focus:outline-none';
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-secondary text-white hover:bg-secondary/90',
    outline: 'border border-primary text-primary hover:bg-primary/10',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;

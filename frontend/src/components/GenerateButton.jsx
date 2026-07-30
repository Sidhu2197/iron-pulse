import React from 'react';
import './Button.css'; 

export const GenerateButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  className = '', 
  icon,
  ...props 
}) => {
  return (
    <button 
      className={`generate-btn ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
};

export default GenerateButton;

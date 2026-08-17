import React from 'react';
import AccessibleButton from './AccessibleButton';
import './Button.css'; 

export const GenerateButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  className = '', 
  icon,
  disabledReason,
  ...props 
}) => {
  return (
    <AccessibleButton 
      className={`generate-btn ${className}`}
      onClick={onClick}
      disabled={disabled}
      disabledReason={disabledReason || 'Complete required inputs before generating.'}
      icon={icon}
      {...props}
    >
      {children}
    </AccessibleButton>
  );
};

export default GenerateButton;

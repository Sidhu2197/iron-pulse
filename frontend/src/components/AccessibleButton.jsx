import React, { useState, useId } from 'react';
import { Lock, Info } from 'lucide-react';
import './AccessibleButton.css';

export const AccessibleButton = ({
  children,
  onClick,
  disabled = false,
  disabledReason = 'Complete all required fields before continuing.',
  onDisabledClick,
  className = '',
  style = {},
  type = 'button',
  icon,
  showLockIcon = true,
  ...props
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipId = useId();

  const handleClick = (e) => {
    if (disabled) {
      if (onDisabledClick) {
        e.preventDefault();
        e.stopPropagation();
        onDisabledClick(e);
        return;
      }
      // If no custom onDisabledClick is provided, allow the click/submit to proceed
      // so form validation (handleSubmit) can run, highlight invalid fields,
      // focus the first invalid field, and announce via live region.
    }
    if (onClick) onClick(e);
  };

  const handleKeyDown = (e) => {
    if (disabled && (e.key === 'Enter' || e.key === ' ')) {
      if (onDisabledClick) {
        e.preventDefault();
        e.stopPropagation();
        onDisabledClick(e);
      }
    }
  };

  const isFullWidth = style && style.width === '100%';

  return (
    <div 
      className={`accessible-btn-wrapper ${isFullWidth ? 'w-full-wrapper' : ''}`}
      style={{ position: 'relative', display: isFullWidth ? 'block' : 'inline-block', width: isFullWidth ? '100%' : 'auto' }}
      onMouseEnter={() => disabled && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type={type}
        className={`accessible-btn ${className} ${disabled ? 'is-aria-disabled' : ''}`}
        aria-disabled={disabled}
        aria-describedby={disabled ? tooltipId : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => disabled && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => disabled && setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        style={style}
        {...props}
      >
        {disabled && showLockIcon && (
          <Lock size={14} className="a11y-lock-icon" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline' }} aria-hidden="true" />
        )}
        {icon && <span className="btn-icon">{icon}</span>}
        {children}
      </button>

      {disabled && showTooltip && (
        <div id={tooltipId} role="tooltip" className="a11y-btn-tooltip">
          <Info size={14} className="a11y-info-icon" aria-hidden="true" />
          <span>{disabledReason}</span>
        </div>
      )}
    </div>
  );
};

export default AccessibleButton;

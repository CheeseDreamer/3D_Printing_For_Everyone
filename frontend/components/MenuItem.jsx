import React from 'react';

function MenuItem({
  label,
  icon,
  isActive,
  onClick,
  isExpandable,
  isExpanded,
  isSubItem
}) {
  const itemClasses = [
    "menu-item", 
    isActive ? "active" : '',
    isSubItem ? "sub-item" : '',
    isExpandable ? "expandable" : '',
    (isExpandable && isExpanded) ? "expanded-parent-style" : ''
  ].filter(Boolean).join(' ');

  return (
    <li
      className={itemClasses}
      onClick={onClick}
    >
      {icon && <span className="icon">{icon}</span>}
      <span className="label">{label}</span>
      {isExpandable && (
        <span className={`arrow ${isExpanded ? 'arrow-expanded' : ''}`}>
          ▶
        </span>
      )}
    </li>
  );
}

export default MenuItem;
import React from 'react';
import MenuItem from './MenuItem';
function LeftMenu({ items, activeItemId, expandedParentId, onItemClick, onLogout }) { 
  return (
    <nav className="left-menu">
      <div className="logo-area">
        3D Printing For Everyone
      </div>
      <ul className="menu-list">
        {items.map((item) => (
          <React.Fragment key={item.id}>
            <MenuItem
              label={item.label}
              icon={item.icon}
              isActive={item.id === activeItemId && (!item.subItems || item.id !== expandedParentId)}
              onClick={() => onItemClick(item)}
              isExpandable={!!item.subItems}
              isExpanded={item.id === expandedParentId}
            />
            {item.subItems && item.id === expandedParentId && (
              <ul className="sub-menu-list">
                {item.subItems.map((subItem) => (
                  <MenuItem
                    key={subItem.id}
                    label={subItem.label}
                    icon={subItem.icon}
                    isActive={subItem.id === activeItemId}
                    onClick={() => onItemClick(subItem, item.id)}
                    isSubItem={true}
                    isExpandable={false}
                    isExpanded={false}
                  />
                ))}
              </ul>
            )}
          </React.Fragment>
        ))}
      </ul>
    </nav>
  );
}

export default LeftMenu;
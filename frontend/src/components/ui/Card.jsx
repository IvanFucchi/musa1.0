import React from 'react';
import PropTypes from 'prop-types';

const Card = ({
  children,
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = 'bg-white rounded-lg shadow-md overflow-hidden';
  
  return (
    <div
      className={`${baseClasses} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func
};

export default Card;

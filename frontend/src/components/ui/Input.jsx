import React from 'react';
import PropTypes from 'prop-types';

const Input = ({
  type = 'text',
  id,
  name,
  value,
  onChange,
  placeholder,
  disabled = false,
  error = '',
  className = '',
  ...props
}) => {
  const baseClasses = 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors duration-200';
  
  const stateClasses = error
    ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';
  
  const disabledClass = disabled ? 'bg-gray-100 cursor-not-allowed' : '';
  
  return (
    <div className="w-full">
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          ${baseClasses}
          ${stateClasses}
          ${disabledClass}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

Input.propTypes = {
  type: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string
};

export default Input;

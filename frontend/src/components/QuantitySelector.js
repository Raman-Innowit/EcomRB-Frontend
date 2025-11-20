import React from 'react';

const QuantitySelector = ({ 
  value = 1, 
  onChange, 
  min = 1, 
  max = 10,
  className = '',
  showLabel = false,
  label = 'Quantity :'
}) => {
  const handleDecrement = () => {
    if (value > min && onChange) {
      onChange(Math.max(min, value - 1));
    }
  };

  const handleIncrement = () => {
    if (value < max && onChange) {
      onChange(Math.min(max, value + 1));
    }
  };

  const selector = (
    <div className={`inline-flex items-stretch border border-gray-300 rounded-lg overflow-hidden bg-[#f5f5f0] ${className}`}>
      <button
        onClick={handleDecrement}
        disabled={value <= min}
        className="flex-1 min-w-[60px] h-12 text-xl font-semibold text-gray-800 border-r border-gray-300 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="flex-1 min-w-[60px] text-center text-xl font-semibold text-gray-800 border-r border-gray-300 select-none flex items-center justify-center">
        {value}
      </span>
      <button
        onClick={handleIncrement}
        disabled={value >= max}
        className="flex-1 min-w-[60px] h-12 text-xl font-semibold text-gray-800 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );

  if (showLabel) {
    return (
      <div className="flex items-center gap-3">
        <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">{label}</p>
        {selector}
      </div>
    );
  }

  return selector;
};

export default QuantitySelector;


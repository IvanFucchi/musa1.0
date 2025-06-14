import React from 'react';

const MapPinList = ({pinsData, selectedPinId, onSelectPin}) => {
  if (!pinsData.length) {
    return <p className="p-4 text-gray-500">Nessuno spot da mostrare.</p>;
  }

  return (
    <div className="overflow-y-auto md:pe-6 grid grid-cols-1 gap-4 w-full">
      {pinsData.map((pin, idx) => {
        const {id, position: {lat, lng}, title, description} = pin;
        const isSelected = id === selectedPinId;
        return (
          <div
            key={id}
            onClick={() => onSelectPin(id)}
            className={`
              cursor-pointer
              bg-white border rounded-lg p-4 hover:shadow-md transition-shadow duration-200
              ${isSelected ? 'border-blue-500 bg-blue-50' : ''}
              ${idx === 0 ? 'mt-4' : ''}
              ${idx === pinsData.length - 1 ? 'mb-4' : ''}
            `}
          >
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            <p className="text-sm mb-2 text-zinc-600">{description}</p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              Indicazioni →
            </a>
          </div>
        );
      })}
    </div>
  );
};

export default MapPinList;

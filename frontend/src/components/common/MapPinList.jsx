import React from "react";

const MapPinList = ({pinsData, onPinSelect}) => {
  if (!Array.isArray(pinsData) || pinsData.length === 0) {
    return <p className="p-4 text-gray-500">Nessuno spot da mostrare.</p>;
  }

  return (
    <div className="overflow-y-auto md:pe-6 grid grid-cols-1 gap-4 w-full">
      {pinsData.map((pin, idx) => {
        const {id, position: {lat, lng}, title, description} = pin;
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

        return (
          <div
            key={id}
            onClick={() => onPinSelect(id)}
            className={`
              bg-white border rounded-lg p-4 hover:shadow-md transition-shadow duration-200
              ${idx === 0 ? "mt-4" : ""}
              ${idx === pinsData.length - 1 ? "mb-4" : ""}
              cursor-pointer
            `}
          >
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            <p className="text-sm mb-2 text-zinc-600">{description}</p>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-medium text-blue-600 hover:underline"
              onClick={e => e.stopPropagation()}
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

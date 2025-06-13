import { useEffect } from "react";
import { useMap } from "react-leaflet";

const FlyToLocation = ({ coords }) => {
  const map = useMap();

  useEffect(() => {
    if (coords) {
      map.flyTo(coords, map.getZoom(), {
        animate: true,
        duration: 1.5,
      });
    }
  }, [coords, map]);

  return null;
};

export default FlyToLocation;

import MapPins from "@/components/common/MapPins";
import MapPinList from "@/components/common/MapPinList";
import {useSearchParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {useGlobalState} from "@/context/GlobalState";

const ExplorePage = () => {
  const {place, activity} = useGlobalState();
  const [searchParams] = useSearchParams();
  const [pinsData, setPinsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const p = searchParams.get("place");
    const a = searchParams.get("activity");
    if ((p && p !== place) || (a && a !== activity)) {
      console.log("Parametri URL:", {p, a});
    }
  }, [searchParams, place, activity]);

  useEffect(() => {
    if (!place?.trim() || !activity?.trim()) return;

    const fetchSpots = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(
          `http://localhost:5000/api/spots?place=${encodeURIComponent(
            place
          )}&activity=${encodeURIComponent(activity)}`
        );
        const json = await res.json();
        if (!json.success) {
          console.error("API returned error:", json);
          setPinsData([]);
          return;
        }

        const mapped = json.data.map((spot, idx) => ({
          id: idx + 1,
          title: spot.title,
          description: spot.description,
          imageUrl: spot.imageUrl,
          position: {
            lat: spot.coordinates[1],
            lng: spot.coordinates[0],
          },
          url: spot.url,
        }));
        setPinsData(mapped);
        setIsLoading(false);
      } catch (err) {
        console.error("Errore nel fetch:", err);
        setPinsData([]);
        setIsLoading(false);
      }
    };

    fetchSpots().then(r => {
      console.log("Risposta API:", r);
    });

  }, [place, activity]);

  return (
    <section className="flex w-full lg:h-[calc(100vh-82px)] min-h-[50vh]">

      {isLoading && 'isLoading'}
      <div className="container mx-auto flex flex-wrap h-full">
        <div className="flex w-full h-full lg:w-1/2">
          <MapPinList pinsData={pinsData}/>
        </div>
        <div className="flex w-full lg:w-1/2 rounded-lg overflow-hidden min-h-[50vh] my-4">
          <MapPins pinsData={pinsData}/>
        </div>
      </div>
    </section>
  );
};

export default ExplorePage;

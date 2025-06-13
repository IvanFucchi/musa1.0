import MapPins from "@/components/common/MapPins";
import MapPinList from "@/components/common/MapPinList";
import {useSearchParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {useGlobalState, useGlobalDispatch} from "@/context/GlobalState";

const ExplorePage = () => {
  const {place, activity} = useGlobalState();
  const dispatch = useGlobalDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pinsData, setPinsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const p = searchParams.get("place");
    const a = searchParams.get("activity");

    if (!p || !a) {
      setSearchParams(
        {place: p || "roma", activity: a || "arte"},
        {replace: true}
      );
      dispatch({type: "SET_PLACE", payload: p || "roma"});
      dispatch({type: "SET_ACTIVITY", payload: a || "arte"});
    } else if (p !== place || a !== activity) {
      dispatch({type: "SET_PLACE", payload: p});
      dispatch({type: "SET_ACTIVITY", payload: a});
    }
  }, [searchParams, setSearchParams, dispatch, place, activity]);

  useEffect(() => {
    if (!place?.trim() || !activity?.trim()) return;

    const fetchSpots = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `http://localhost:5000/api/spots?place=${encodeURIComponent(
            place
          )}&activity=${encodeURIComponent(activity)}`
        );
        const json = await res.json();
        if (!json.success) {
          setPinsData([]);
        } else {
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
        }
      } catch {
        setPinsData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpots();
  }, [place, activity]);

  return (
    <section className="flex w-full lg:h-[calc(100vh-82px)] min-h-[50vh]">
      {isLoading ? (
        <div className="container mx-auto flex items-center justify-center h-full">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-zinc-800 border-t-transparent"></div>
            <p className="mt-4 text-zinc-600 text-sm">Caricamento in corso…</p>
          </div>
        </div>
      ) : (
        <div className="container mx-auto flex flex-wrap h-full">
          <div className="flex w-full h-full lg:w-1/2">
            <MapPinList pinsData={pinsData}/>
          </div>
          <div className="flex w-full lg:w-1/2 rounded-lg overflow-hidden min-h-[50vh] my-4">
            <MapPins pinsData={pinsData}/>
          </div>
        </div>
      )}
    </section>
  );
};

export default ExplorePage;

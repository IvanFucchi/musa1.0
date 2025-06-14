import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import MapPins from '@/components/common/MapPins';
import MapPinList from '@/components/common/MapPinList';
import {useGlobalState, useGlobalDispatch} from '@/context/GlobalState';

const DEFAULT_PLACE = 'roma';
const DEFAULT_ACTIVITY = 'arte';

let lastFetchParams = {place: null, activity: null};

const ExplorePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useGlobalDispatch();
  const {place, activity} = useGlobalState();

  const [pinsData, setPinsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPinId, setSelectedPinId] = useState(null);
  const backendUrl = process.env.REACT_APP_BACKEND_PATH || 'http://localhost:5000';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const p = params.get('place');
    const a = params.get('activity');

    if (!p || !a) {
      navigate(
        `/explore?place=${DEFAULT_PLACE}&activity=${DEFAULT_ACTIVITY}`,
        {replace: true}
      );
      return;
    }

    if (p !== place) {
      dispatch({type: 'SET_PLACE', payload: p});
    }
    if (a !== activity) {
      dispatch({type: 'SET_ACTIVITY', payload: a});
    }
  }, [location.search, navigate, dispatch, place, activity]);

  useEffect(() => {
    if (!place.trim() || !activity.trim()) return;

    const fetchSpots = async () => {
      setIsLoading(true);
      console.log('>>> Fetching spots for place:', place, 'activity:', activity);

      try {
        const res = await fetch(
          `${backendUrl}/api/spots?place=${encodeURIComponent(place)}&activity=${encodeURIComponent(activity)}`
        );
        const json = await res.json();
        if (json.success) {
          setPinsData(
            json.data.map((spot, i) => ({
              id: i + 1,
              title: spot.title,
              description: spot.description,
              imageUrl: spot.imageUrl,
              position: {
                lat: spot.coordinates[1],
                lng: spot.coordinates[0],
              },
              url: spot.url,
            }))
          );
        } else {
          setPinsData([]);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setPinsData([]);
      } finally {
        setIsLoading(false);
        lastFetchParams = {place, activity};
      }
    };

    fetchSpots();
  }, [place, activity, backendUrl]);

  return (
    <section className="flex w-full lg:h-[calc(100vh-82px)] min-h-[50vh]">
      {isLoading ? (
        <div className="container mx-auto flex items-center justify-center h-full">
          <div className="flex flex-col items-center my-20">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-zinc-800 border-t-transparent"/>
            <p className="mt-4 text-zinc-600 text-sm">Caricamento in corso…</p>
          </div>
        </div>
      ) : (
        <div className="container mx-auto flex flex-wrap h-full">
          <div className="flex w-full h-full lg:w-1/2">
            <MapPinList
              pinsData={pinsData}
              selectedPinId={selectedPinId}
              onSelectPin={setSelectedPinId}
            />
          </div>
          <div className="flex w-full lg:w-1/2 rounded-lg overflow-hidden min-h-[50vh] my-4">
            <MapPins
              pinsData={pinsData}
              selectedPinId={selectedPinId}
              onSelectPin={setSelectedPinId}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default ExplorePage;

import React, {useState, useRef, useEffect} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {useGlobalState, useGlobalDispatch} from '@/context/GlobalState';
import {MagnifyingGlassIcon} from '@heroicons/react/24/solid';

const SearchForm = () => {
  const {place: globalPlace, activity: globalActivity} = useGlobalState();
  const dispatch = useGlobalDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [placeInput, setPlaceInput] = useState('');
  const [activityInput, setActivityInput] = useState('');

  const placeRef = useRef(null);
  const activityRef = useRef(null);

  useEffect(() => {
    if (location.pathname.startsWith('/explore')) {
      setPlaceInput(globalPlace || '');
      setActivityInput(globalActivity || '');
    } else {
      setPlaceInput('');
      setActivityInput('');
    }
  }, [location.pathname, globalPlace, globalActivity]);

  useEffect(() => {
    if (location.pathname.startsWith('/explore')) {
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  }, [location.pathname]);

  const isValid = placeInput.trim() !== '' && activityInput.trim() !== '';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;

    dispatch({type: 'SET_PLACE', payload: placeInput.trim()});
    dispatch({type: 'SET_ACTIVITY', payload: activityInput.trim()});

    placeRef.current?.blur();
    activityRef.current?.blur();

    const params = new URLSearchParams({
      place: placeInput.trim(),
      activity: activityInput.trim(),
    });
    navigate(`/explore?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2 w-full">
      <div className="flex items-center p-1 border rounded-md w-full">
        <input
          type="text"
          name="place"
          placeholder="Luogo"
          value={placeInput}
          onChange={(e) => setPlaceInput(e.target.value)}
          ref={placeRef}
          className="w-full px-2 border-r"
          aria-label="Luogo da cercare"
        />
        <input
          type="text"
          name="activity"
          placeholder="Attività (arte)"
          value={activityInput}
          onChange={(e) => setActivityInput(e.target.value)}
          ref={activityRef}
          className="w-full px-2"
          aria-label="Attività artistica da cercare"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-zinc-950 text-white rounded hover:bg-zinc-700"
          disabled={!isValid}
        >
          <MagnifyingGlassIcon className="h-5 w-5"/>
        </button>
      </div>
    </form>
  );
};

export default SearchForm;

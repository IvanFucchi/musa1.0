import React, {createContext, useReducer, useContext, useEffect} from 'react';
import {useLocation} from 'react-router-dom';

const GlobalStateContext = createContext(undefined);
const GlobalDispatchContext = createContext(undefined);

const initialState = {
  place: '',
  activity: ''
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PLACE':
      return {...state, place: action.payload};
    case 'SET_ACTIVITY':
      return {...state, activity: action.payload};
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

// Provider component that reads URL query params on mount
export const GlobalProvider = ({children}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const placeParam = params.get('place');
    const activityParam = params.get('activity');

    // If both params exist, dispatch and trigger initial search
    if (placeParam && activityParam) {
      dispatch({type: 'SET_PLACE', payload: placeParam});
      dispatch({type: 'SET_ACTIVITY', payload: activityParam});
      console.log('Search submitted (initial):', {
        place: placeParam,
        activity: activityParam,
      });
    }
  }, [location.search]);

  return (
    <GlobalStateContext.Provider value={state}>
      <GlobalDispatchContext.Provider value={dispatch}>
        {children}
      </GlobalDispatchContext.Provider>
    </GlobalStateContext.Provider>
  );
};

// Custom hooks
export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (context === undefined) throw new Error('useGlobalState must be used within a GlobalProvider');
  return context;
};

export const useGlobalDispatch = () => {
  const context = useContext(GlobalDispatchContext);
  if (context === undefined) throw new Error('useGlobalDispatch must be used within a GlobalProvider');
  return context;
};

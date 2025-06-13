import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Componente per gestire il callback OAuth
const OAuthCallback = () => {
  const { loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Quando il componente AuthContext ha finito di elaborare il token nell'URL
    // e ha aggiornato lo stato di autenticazione, reindirizza alla home
    if (!loading) {
      navigate('/');
    }
  }, [loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Autenticazione in corso...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
};

export default OAuthCallback;

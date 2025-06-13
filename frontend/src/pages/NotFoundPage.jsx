import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const NotFoundPage = () => {
  return (
    <div className="text-center py-16">
      <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Pagina non trovata</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        La pagina che stai cercando non esiste o è stata spostata.
      </p>
      <Link to="/">
        <Button variant="primary">Torna alla home</Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;

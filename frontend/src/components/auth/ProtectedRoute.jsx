import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';

/**
 * Componente per proteggere le route che richiedono autenticazione e verifica email
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Contenuto da mostrare se l'utente è autenticato e verificato
 * @param {boolean} props.requireVerified - Se true, richiede che l'email sia verificata
 */
const ProtectedRoute = ({ children, requireVerified = true }) => {
  const { isAuthenticated, isEmailVerified, loading } = useAuth();
  const location = useLocation();
  const [showVerificationModal, setShowVerificationModal] = React.useState(false);
  
  // Mostra un loader durante il caricamento
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Se l'utente non è autenticato, reindirizza al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Se l'utente è autenticato ma l'email non è verificata e la route richiede la verifica
  if (requireVerified && !isEmailVerified) {
    // Mostra il modale di verifica email
    return (
      <>
        {showVerificationModal ? (
          <Modal
            isOpen={true}
            onClose={() => setShowVerificationModal(false)}
            title="Email Verification Required"
            message="You need to verify your email address before accessing this feature. Please check your inbox for the verification link."
            type="warning"
            actions={
              <div className="flex flex-col sm:flex-row-reverse gap-2">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setShowVerificationModal(false);
                    window.location.href = '/';
                  }}
                >
                  Go to Home
                </button>
              </div>
            }
          />
        ) : (
          <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 max-w-md w-full">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Email Verification Required</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>You need to verify your email address before accessing this feature.</p>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      onClick={() => setShowVerificationModal(true)}
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
  
  // Se l'utente è autenticato e (l'email è verificata o la route non richiede la verifica)
  return children;
};

export default ProtectedRoute;

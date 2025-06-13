import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { useAuth } from '../context/AuthContext';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  
  // Redirect se non admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/';
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Alert type="error" message="Accesso non autorizzato" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Dashboard Amministratore</h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Contenuti in attesa
          </button>
          <button
            onClick={() => setActiveTab('spots')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'spots'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Gestione Spot
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Gestione Utenti
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div>
        {activeTab === 'pending' && <PendingContentTab />}
        {activeTab === 'spots' && <SpotsManagementTab />}
        {activeTab === 'users' && <UsersManagementTab />}
      </div>
    </div>
  );
};

// Tab per i contenuti in attesa di approvazione
const PendingContentTab = () => {
  const [pendingContent, setPendingContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchPendingContent();
  }, []);

  const fetchPendingContent = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('http://localhost:5000/api/ugc/pending');
      
      if (data.success) {
        setPendingContent(data.data);
      } else {
        setError('Errore nel caricamento dei contenuti in attesa');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nel caricamento dei contenuti');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const { data } = await axios.put(`http://localhost:5000/api/ugc/${id}/approve`);
      
      if (data.success) {
        setPendingContent(prev => prev.filter(item => item._id !== id));
        setSuccessMessage('Contenuto approvato con successo');
        
        // Nascondi il messaggio dopo 3 secondi
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Errore durante l\'approvazione');
    }
  };

  const handleReject = async (id) => {
    try {
      const { data } = await axios.delete(`http://localhost:5000/api/ugc/${id}`);
      
      if (data.success) {
        setPendingContent(prev => prev.filter(item => item._id !== id));
        setSuccessMessage('Contenuto rifiutato con successo');
        
        // Nascondi il messaggio dopo 3 secondi
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Errore durante il rifiuto');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Caricamento contenuti in attesa...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Contenuti in attesa di approvazione</h2>
        <Button 
          variant="outline" 
          onClick={fetchPendingContent}
        >
          Aggiorna
        </Button>
      </div>
      
      {error && <Alert type="error" message={error} className="mb-4" />}
      {successMessage && <Alert type="success" message={successMessage} className="mb-4" />}
      
      {pendingContent.length > 0 ? (
        <div className="space-y-6">
          {pendingContent.map(content => (
            <Card key={content._id} className="p-4">
              <div className="flex justify-between">
                <div>
                  <div className="flex items-center mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      content.type === 'review' ? 'bg-blue-100 text-blue-800' :
                      content.type === 'comment' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {content.type === 'review' ? 'Recensione' : 
                       content.type === 'comment' ? 'Commento' : 'Foto'}
                    </span>
                    
                    <span className="ml-2 text-gray-500 text-sm">
                      {new Date(content.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center mb-3">
                    {content.user?.avatar ? (
                      <img src={content.user.avatar} alt={content.user.name} className="w-8 h-8 rounded-full mr-2" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">
                        {content.user?.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium">{content.user?.name}</span>
                  </div>
                  
                  {content.spot && (
                    <p className="text-sm text-gray-600 mb-3">
                      Spot: <span className="font-medium">{content.spot.name}</span>
                    </p>
                  )}
                  
                  {content.type === 'review' && content.rating && (
                    <div className="flex mb-2">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i} 
                          className={`w-5 h-5 ${i < content.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  )}
                  
                  {content.content && (
                    <p className="text-gray-700">{content.content}</p>
                  )}
                  
                  {content.type === 'photo' && content.imageUrl && (
                    <div className="mt-3 max-w-md">
                      <img 
                        src={content.imageUrl} 
                        alt="Contenuto utente" 
                        className="rounded-lg"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleApprove(content._id)}
                  >
                    Approva
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleReject(content._id)}
                  >
                    Rifiuta
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Nessun contenuto in attesa di approvazione</p>
        </div>
      )}
    </div>
  );
};

// Tab per la gestione degli spot
const SpotsManagementTab = () => {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <p className="text-gray-600">Funzionalità in arrivo</p>
      <p className="mt-2">La gestione completa degli spot sarà disponibile nella prossima versione.</p>
    </div>
  );
};

// Tab per la gestione degli utenti
const UsersManagementTab = () => {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <p className="text-gray-600">Funzionalità in arrivo</p>
      <p className="mt-2">La gestione completa degli utenti sarà disponibile nella prossima versione.</p>
    </div>
  );
};

export default AdminDashboardPage;

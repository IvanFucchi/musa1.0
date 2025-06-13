// src/components/auth/VerifyEmail.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from 'lib/api';
import Alert from '../ui/Alert';
import Button from '../ui/Button';

export default function VerifyEmail() {
  // Prendi solo il token da route param
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Link di verifica non valido.');
      return;
    }

    const verify = async () => {
      try {
        console.log('>>> Frontend calling verify-email with token:', token);
        const { data } = await api.get(`/api/auth/verify-email/${token}`);
        if (data.success) {
          setStatus('success');
          setMessage('Email verificata con successo! Verrai reindirizzato alla home…');
          setTimeout(() => navigate('/'), 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verifica fallita');
        }
      } catch (err) {
        console.error('Errore verify-email:', err.response?.data || err.message);
        setStatus('error');
        setMessage(
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Errore nella verifica dell\'email'
        );
      }
    };

    verify();
  }, [token, navigate]);

  if (status === 'loading') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Verifica in corso…</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 space-y-6 text-center">
      {status === 'success' ? (
        <Alert type="success" message={message} />
      ) : (
        <Alert type="error" message={message} />
      )}

      {status === 'error' && (
        <Link to="/login">
          <Button variant="primary">Torna al Login</Button>
        </Link>
      )}
    </div>
  );
}

// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import axios from 'axios';
import AvatarCropper from '../components/common/AvatarCropper';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateProfile, loading } = useAuth();

  // form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // contenuti
  const [userContent, setUserContent] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    // popola form con dati utente
    setFormData({
      name: user.name || '',
      email: user.email || '',
      bio: user.bio || '',
      password: '',
      confirmPassword: '',
    });
    fetchUserContent();
  }, [user]);

  const fetchUserContent = async () => {
    if (!user) return;
    try {
      setContentLoading(true);
      const { data } = await axios.get('http://localhost:5000/api/ugc/user');
      if (data.success) setUserContent(data.data);
    } catch (err) {
      console.error('Errore caricamento contenuti:', err);
    } finally {
      setContentLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (formData.password && formData.password !== formData.confirmPassword) {
      setFormError('Le password non corrispondono');
      return;
    }
    const updateData = { name: formData.name, bio: formData.bio };
    if (formData.password) updateData.password = formData.password;

    const result = await updateProfile(updateData);
    if (result.success) {
      setFormSuccess('Profilo aggiornato con successo');
      setFormData((p) => ({ ...p, password: '', confirmPassword: '' }));
    } else {
      setFormError(result.error || "Errore durante l'aggiornamento del profilo");
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">
          Effettua l'accesso per visualizzare il tuo profilo
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="page-title">Il tuo profilo</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Colonna sinistra - Informazioni profilo */}
        <div className="md:col-span-1">
          <Card className="p-6">
            <div className="text-center mb-6">
              {/* AvatarCropper si occupa di mostrare e modificare l'avatar tondo */}
              <AvatarCropper />

              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
              {user.role === 'admin' && (
                <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  Amministratore
                </span>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Bio</h3>
              <p className="text-gray-700">{user.bio || 'Nessuna bio disponibile'}</p>
            </div>
          </Card>
        </div>

        {/* Colonna centrale - Form modifica profilo */}
        <div className="md:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Modifica profilo</h2>

            {formError && <Alert type="error" message={formError} className="mb-4" />}
            {formSuccess && <Alert type="success" message={formSuccess} className="mb-4" />}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  L'email non può essere modificata
                </p>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Racconta qualcosa su di te..."
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-3">Cambia password</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Nuova password
                    </label>
                    <Input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Lascia vuoto per non modificare"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Conferma nuova password
                    </label>
                    <Input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Conferma la nuova password"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" variant="primary" loading={loading}>
                  Salva modifiche
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {/* Sezione contenuti utente */}
      <div>
        <h2 className="text-xl font-semibold mb-4">I tuoi contenuti</h2>
        {contentLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Caricamento contenuti...</p>
          </div>
        ) : userContent.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userContent.map((content) => (
              <Card key={content._id} className="overflow-hidden">
                {/* ... rendering dei contenuti ... */}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Non hai ancora creato contenuti</p>
            <p className="mt-2">Esplora gli spot artistici e condividi le tue esperienze!</p>
            <Button variant="primary" className="mt-4" onClick={() => navigate('/explore')}>
              Esplora ora
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;

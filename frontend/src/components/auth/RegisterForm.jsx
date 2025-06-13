import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import Input from '../ui/Input';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formError, setFormError] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Validazione base
    if (!formData.name || !formData.email || !formData.password) {
      setFormError('Tutti i campi sono obbligatori');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setFormError('Le password non corrispondono');
      return;
    }
    
    if (formData.password.length < 6) {
      setFormError('La password deve essere di almeno 6 caratteri');
      return;
    }
    
    // Tentativo di registrazione
    const result = await register(formData.name, formData.email, formData.password);
    
    if (result.success) {
      navigate('/');
    } else {
      setFormError(result.error || 'Errore durante la registrazione');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Crea un nuovo account</h2>
      
      {formError && <Alert type="error" message={formError} className="mb-4" />}
      
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
            placeholder="Il tuo nome"
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
            onChange={handleChange}
            placeholder="La tua email"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <Input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Crea una password"
            required
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Conferma Password
          </label>
          <Input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Conferma la tua password"
            required
          />
        </div>
        
        <div className="flex items-center">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            required
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
            Accetto i <a href="#" className="text-blue-600 hover:text-blue-500">Termini di Servizio</a> e la <a href="#" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>
          </label>
        </div>
        
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
        >
          Registrati
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Hai già un account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;

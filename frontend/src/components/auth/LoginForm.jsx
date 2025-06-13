import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import Input from '../ui/Input';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [formError, setFormError] = useState('');
  const { login, loading } = useAuth();
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
    if (!formData.email || !formData.password) {
      setFormError('Inserisci email e password');
      return;
    }
    
    // Tentativo di login
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/');
    } else {
      setFormError(result.error || 'Errore durante il login');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Accedi al tuo account</h2>
      
      {formError && <Alert type="error" message={formError} className="mb-4" />}
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="La tua password"
            required
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Ricordami
            </label>
          </div>
          
          <div className="text-sm">
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Password dimenticata?
            </a>
          </div>
        </div>
        
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
        >
          Accedi
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Non hai un account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-500 font-medium">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;

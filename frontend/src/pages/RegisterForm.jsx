import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formError, setFormError] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const { register, loading, resendVerificationEmail } = useAuth();
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
      setFormError('All fields are required');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    
    // Tentativo di registrazione
    const result = await register(formData.name, formData.email, formData.password);
    
    if (result.success) {
      // Salva l'email per il modale di verifica
      setRegisteredEmail(formData.email);
      // Mostra il modale di verifica email
      setShowVerificationModal(true);
    } else {
      setFormError(result.error || 'Error during registration');
    }
  };

  const handleResendVerification = async () => {
    if (!registeredEmail) return;
    
    const result = await resendVerificationEmail(registeredEmail);
    if (result.success) {
      // Aggiorna il messaggio nel modale
      // Qui potresti aggiungere uno stato per mostrare un messaggio di successo nel modale
    } else {
      setFormError(result.error || 'Error resending verification email');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        {/* Logo */}
        <span className="flex items-center text-2xl font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 mr-2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          MUSA ~ Discover Art
        </span>
      </div>
      
      <h2 className="text-2xl font-bold mb-2">Create a new account</h2>
      <p className="text-sm text-gray-500 mb-6">
        Enter your details to register a new account
      </p>
      
      {/* Mostra eventuali errori */}
      {formError && (
        <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
          {formError}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Username
          </label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="yourusername"
            required
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <Input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="m@example.com"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <Input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
            Confirm Password
          </label>
          <Input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
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
            I accept the <a href="#" className="text-blue-600 hover:text-blue-500">Terms of Service</a> and <a href="#" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>
          </label>
        </div>
        
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
        >
          {loading ? "Registering..." : "Register"}
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
            Sign in
          </Link>
        </p>
      </div>

      {/* Modal per la verifica email */}
      <Modal
        isOpen={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false);
          navigate('/login');
        }}
        title="Verify Your Email"
        message={`We've sent a verification link to ${registeredEmail}. Please check your inbox and click the link to verify your account.`}
        type="info"
        actions={
          <div className="flex flex-col sm:flex-row-reverse gap-2">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
              onClick={() => {
                setShowVerificationModal(false);
                navigate('/login');
              }}
            >
              Go to Login
            </button>
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
              onClick={handleResendVerification}
            >
              Resend Verification Email
            </button>
          </div>
        }
      />
    </div>
  );
};

export default RegisterForm;

import React, {useState, useEffect} from "react";
import {Link, useNavigate, useLocation} from "react-router-dom";
import {useAuth} from "@/context/AuthContext";
import {Input} from "ui/input";
import {Button} from "ui/button";
import {Label} from "ui/label";

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const {login, loginWithGoogle, isAuthenticated, error: authError} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from);
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Errore durante il login');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  return (
    <div className="flex flex-wrap md:min-h-screen bg-white">
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 my-20">
        <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-sm">
          <header>
            <h2 className="text-2xl font-bold mb-2">Accedi al tuo account</h2>
            <p className="text-sm text-zinc-600 mb-6">
              Inserisci le tue credenziali per accedere
            </p>
          </header>
          {error && <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4 text-sm">{error}</div>}
          <div className='space-y-6'>
            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Button
              type="submit"
              className="w-full bg-zinc-950 text-white hover:opacity-80"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Accesso in corso...' : 'Accedi'}
            </Button>
            <Button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center bg-transparent border border-zinc-950 hover:opacity-80"
            >
              Google
            </Button>
          </div>
          <div className="text-sm text-zinc-600">
            <span className='me-2'>Non hai un account?</span>
            <Link to="/register" className="text-zinc-950 font-bold hover:underline">Registrati</Link>
          </div>
        </form>
      </div>
      <div className="w-full lg:w-1/2 hidden lg:block bg-cover bg-center" style={{backgroundImage: `url('/images/1caverna_chauvet_.png')`}}/>
    </div>
  );
};

export default LoginPage;

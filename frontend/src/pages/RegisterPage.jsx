import React, {useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useAuth} from "@/context/AuthContext";
import {Input} from "ui/input";
import {Button} from "ui/button";
import {Label} from "ui/label";

export default function RegisterPage() {
  const navigate = useNavigate();
  const {register} = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    const {id, value} = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (formData.password !== formData.confirmPassword) {
        setError("Le password non corrispondono");
        setIsSubmitting(false);
        return;
      }

      const response = await register(formData.username, formData.email, formData.password);
      if (response) {
        setSuccess(true);
        setSuccessMessage("Verifica la tua email per completare la creazione del tuo account.");

        // CHECKME - Flusso post registrazione
        setTimeout(() => {
          navigate('/explore');
        }, 2000)

      }
    } catch (err) {
      setError(err.response?.data?.message || "Errore durante la registrazione");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-wrap md:min-h-screen bg-white">
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 my-20">
        <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
          <header>
            <h2 className="text-2xl font-bold mb-2">Create a new account</h2>
            <p className="text-sm text-gray-400 mb-6">
              Enter your details to register a new account
            </p>
          </header>
          {error && <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">{error}</div>}
          {success &&
            <div className="bg-green-500 bg-opacity-10 border border-green-500 text-green-500 px-4 py-3 rounded mb-4">{successMessage}</div>}
          <div className='space-y-6'>
            <div className="grid gap-3">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="your username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
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
              {isSubmitting ? "Registrazione in corso..." : "Registrati"}
            </Button>
          </div>
          <div className="text-sm text-zinc-600">
            <span className='me-2'>Hai già un account?</span>
            <Link to="/login" className="text-zinc-950 font-bold hover:underline">Vai al Login</Link>
          </div>
        </form>
      </div>
      <div className="w-full lg:w-1/2 hidden lg:block bg-cover bg-center" style={{backgroundImage: `url('/images/pittura-di-lascaux-orig.png')`}}/>
    </div>
  );
}

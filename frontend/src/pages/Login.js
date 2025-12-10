import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Film } from 'lucide-react';
import { toast } from 'sonner';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8" data-testid="login-page">
      <div className="noise-texture" />
      <div className="glass-card-heavy rounded-xl p-12 w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Film className="w-10 h-10 text-primary" />
          <h1 className="text-3xl font-bold uppercase tracking-wider">CineBook</h1>
        </div>
        
        <h2 className="text-2xl font-bold mb-8 text-center uppercase tracking-wide">Sign In</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
          <div>
            <Label htmlFor="email" className="text-gray-300 mb-2 block">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/5 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 h-12 text-white"
              placeholder="your@email.com"
              required
              data-testid="email-input"
            />
          </div>
          
          <div>
            <Label htmlFor="password" className="text-gray-300 mb-2 block">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 h-12 text-white"
              placeholder="••••••••"
              required
              data-testid="password-input"
            />
          </div>
          
          <Button 
            type="submit" 
            className="btn-primary w-full" 
            disabled={loading}
            data-testid="submit-btn"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        
        <div className="mt-8 text-center text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:text-primary/80 font-semibold" data-testid="register-link">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Film, User, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/button';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="cinema-header flex items-center justify-between px-8" data-testid="main-header">
      <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
        <Film className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold uppercase tracking-wider text-white">CineBook</h1>
      </Link>
      
      <nav className="flex items-center gap-6">
        <Link to="/movies" className="text-gray-300 hover:text-white transition-colors" data-testid="movies-link">
          Movies
        </Link>
        
        {user ? (
          <>
            <Link to="/my-bookings" className="text-gray-300 hover:text-white transition-colors" data-testid="my-bookings-link">
              My Bookings
            </Link>
            
            {user.role === 'admin' && (
              <Link to="/admin" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2" data-testid="admin-link">
                <LayoutDashboard className="w-4 h-4" />
                Admin
              </Link>
            )}
            
            <div className="flex items-center gap-3 ml-4">
              <div className="flex items-center gap-2 text-gray-300">
                <User className="w-4 h-4" />
                <span data-testid="user-name">{user.name}</span>
              </div>
              <Button 
                onClick={handleLogout} 
                variant="ghost" 
                size="sm" 
                className="text-gray-300 hover:text-white"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <Link to="/login" data-testid="login-link">
            <Button variant="outline" className="btn-secondary" data-testid="login-btn">
              Login
            </Button>
          </Link>
        )}
      </nav>
    </header>
  );
};
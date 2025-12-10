import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MovieCard } from '../components/MovieCard';
import { Button } from '../components/ui/button';
import { Play, Sparkles } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Home = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/movies`)
      .then(response => {
        setMovies(response.data.slice(0, 6));
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching movies:', error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen" data-testid="home-page">
      <div className="noise-texture" />
      
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1653045474061-075ba29db54f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwxfHxjaW5lbWF0aWMlMjBtb3ZpZSUyMHNjZW5lcyUyMGFjdGlvbiUyMHNjaS1maSUyMGRyYW1hfGVufDB8fHx8MTc2NTM2MDg0M3ww&ixlib=rb-4.1.0&q=85)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
        <div className="hero-glow absolute inset-0" />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center px-8 animate-fade-in-up">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
            <span className="text-primary text-sm uppercase tracking-widest font-bold">Premium Cinema Experience</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
            Experience Cinema Reborn
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-300 mb-12 max-w-2xl mx-auto font-light">
            Book your seats. Immerse yourself in blockbusters. Create unforgettable memories.
          </p>
          
          <div className="flex items-center justify-center gap-6">
            <Button 
              onClick={() => navigate('/movies')} 
              className="btn-primary"
              data-testid="explore-movies-btn"
            >
              <Play className="w-5 h-5 mr-2" />
              Explore Movies
            </Button>
          </div>
        </div>
      </section>
      
      <section className="py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-wide mb-2">Now Showing</h2>
              <p className="text-gray-400">The hottest movies in theaters</p>
            </div>
            <Button 
              onClick={() => navigate('/movies')} 
              variant="outline" 
              className="btn-secondary"
              data-testid="view-all-btn"
            >
              View All
            </Button>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {movies.map(movie => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </div>
      </section>
      
      <section className="py-20 px-8 bg-gradient-to-b from-transparent to-muted/20">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-wide mb-6">Why Choose CineBook?</h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="glass-card p-8 rounded-xl">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 uppercase tracking-wide">Easy Booking</h3>
              <p className="text-gray-400">Select your seats, make payment, and get instant confirmation</p>
            </div>
            <div className="glass-card p-8 rounded-xl">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 uppercase tracking-wide">Latest Movies</h3>
              <p className="text-gray-400">Watch the newest blockbusters as soon as they hit theaters</p>
            </div>
            <div className="glass-card p-8 rounded-xl">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 uppercase tracking-wide">Best Experience</h3>
              <p className="text-gray-400">Premium theaters with state-of-the-art sound and picture quality</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
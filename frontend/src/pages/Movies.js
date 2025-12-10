import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MovieCard } from '../components/MovieCard';
import { Input } from '../components/ui/input';
import { Search } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    axios.get(`${API}/movies`)
      .then(response => {
        setMovies(response.data);
        setFilteredMovies(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching movies:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMovies(movies);
    } else {
      const filtered = movies.filter(movie => 
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.genre.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMovies(filtered);
    }
  }, [searchQuery, movies]);

  return (
    <div className="min-h-screen pt-32 pb-20 px-8" data-testid="movies-page">
      <div className="noise-texture" />
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold uppercase tracking-wide mb-6">All Movies</h1>
          
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-white/5 border-white/10 focus:border-primary/50 h-12 text-white"
              data-testid="search-input"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No movies found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};
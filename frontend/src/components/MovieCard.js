import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Star } from 'lucide-react';

export const MovieCard = ({ movie }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="movie-poster-card group relative overflow-hidden rounded-lg aspect-[2/3] border-0 cursor-pointer"
      onClick={() => navigate(`/movie/${movie.id}`)}
      data-testid={`movie-card-${movie.id}`}
    >
      <img 
        src={movie.poster_url} 
        alt={movie.title} 
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">{movie.title}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {movie.duration} min
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-primary text-primary" />
              {movie.rating}
            </div>
            <span className="px-2 py-1 bg-primary/20 text-primary text-xs uppercase tracking-wider">
              {movie.genre}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
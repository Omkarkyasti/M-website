import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Clock, Calendar, MapPin, Star } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [theaters, setTheaters] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/movies/${id}`),
      axios.get(`${API}/shows?movie_id=${id}`),
      axios.get(`${API}/theaters`)
    ])
      .then(([movieRes, showsRes, theatersRes]) => {
        setMovie(movieRes.data);
        setShows(showsRes.data);
        const theatersMap = {};
        theatersRes.data.forEach(theater => {
          theatersMap[theater.id] = theater;
        });
        setTheaters(theatersMap);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching movie details:', error);
        toast.error('Failed to load movie details');
        setLoading(false);
      });
  }, [id]);

  const filteredShows = shows.filter(show => show.date === selectedDate);
  const groupedShows = filteredShows.reduce((acc, show) => {
    if (!acc[show.theater_id]) {
      acc[show.theater_id] = [];
    }
    acc[show.theater_id].push(show);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-gray-400">Movie not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20" data-testid="movie-details-page">
      <div className="noise-texture" />
      
      <div className="relative h-[60vh] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${movie.backdrop_url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>
      
      <div className="max-w-7xl mx-auto px-8 -mt-40 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3">
            <img 
              src={movie.poster_url} 
              alt={movie.title} 
              className="w-full rounded-lg shadow-deep border border-white/10"
            />
          </div>
          
          <div className="md:w-2/3 glass-card-heavy p-8 rounded-xl">
            <h1 className="text-4xl sm:text-5xl font-bold uppercase tracking-wide mb-4" data-testid="movie-title">
              {movie.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 mb-6 text-gray-300">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {movie.duration} min
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-primary text-primary" />
                {movie.rating}
              </div>
              <span className="px-3 py-1 bg-primary/20 text-primary text-sm uppercase tracking-wider">
                {movie.genre}
              </span>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {movie.release_date}
              </div>
            </div>
            
            <p className="text-gray-300 text-lg leading-relaxed mb-8 font-light">
              {movie.description}
            </p>
          </div>
        </div>
        
        <div className="mt-16 mb-20">
          <h2 className="text-3xl font-bold uppercase tracking-wide mb-8">Select Showtime</h2>
          
          <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
            {[...Array(7)].map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() + i);
              const dateStr = date.toISOString().split('T')[0];
              const isSelected = dateStr === selectedDate;
              
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex-shrink-0 px-6 py-4 rounded-lg border transition-all ${
                    isSelected 
                      ? 'bg-primary text-black border-primary font-bold' 
                      : 'bg-white/5 text-white border-white/10 hover:border-white/30'
                  }`}
                  data-testid={`date-${dateStr}`}
                >
                  <div className="text-sm uppercase tracking-wider">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-lg font-bold">
                    {date.getDate()}
                  </div>
                </button>
              );
            })}
          </div>
          
          {Object.keys(groupedShows).length === 0 ? (
            <div className="glass-card p-12 rounded-xl text-center">
              <p className="text-gray-400 text-lg">No shows available for this date.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedShows).map(([theaterId, theaterShows]) => (
                <div key={theaterId} className="glass-card p-6 rounded-xl" data-testid={`theater-${theaterId}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="text-xl font-bold uppercase tracking-wide">
                        {theaters[theaterId]?.name}
                      </h3>
                      <p className="text-gray-400 text-sm">{theaters[theaterId]?.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {theaterShows.map(show => (
                      <Button
                        key={show.id}
                        onClick={() => navigate(`/booking/${show.id}`)}
                        variant="outline"
                        className="btn-secondary"
                        data-testid={`show-${show.id}`}
                      >
                        {show.start_time}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
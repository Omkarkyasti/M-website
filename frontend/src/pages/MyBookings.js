import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Calendar, MapPin, Ticket, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const MyBookings = () => {
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchBookings();
  }, [user, navigate]);

  const fetchBookings = () => {
    axios.get(`${API}/bookings/my`, { headers: getAuthHeaders() })
      .then(response => {
        setBookings(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching bookings:', error);
        toast.error('Failed to load bookings');
        setLoading(false);
      });
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await axios.post(
        `${API}/bookings/${bookingId}/cancel`,
        {},
        { headers: getAuthHeaders() }
      );
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to cancel booking');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-gray-400">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-8" data-testid="my-bookings-page">
      <div className="noise-texture" />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold uppercase tracking-wide mb-8">My Bookings</h1>
        
        {bookings.length === 0 ? (
          <div className="glass-card p-12 rounded-xl text-center">
            <Ticket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-6">You haven't booked any tickets yet</p>
            <Button onClick={() => navigate('/movies')} className="btn-primary" data-testid="browse-movies-btn">
              Browse Movies
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map(booking => (
              <div key={booking.id} className="glass-card p-6 rounded-xl" data-testid={`booking-${booking.id}`}>
                <div className="flex gap-6">
                  <img 
                    src={booking.movie?.poster_url} 
                    alt={booking.movie?.title}
                    className="w-32 h-48 object-cover rounded-lg"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold uppercase tracking-wide mb-2">
                          {booking.movie?.title}
                        </h3>
                        <div className="flex items-center gap-4 text-gray-400 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {booking.theater?.name}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {booking.show?.date} at {booking.show?.start_time}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded text-xs uppercase tracking-wider ${
                          booking.status === 'confirmed' ? 'bg-green-500/20 text-green-500' :
                          booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Seats</p>
                        <p className="font-bold text-primary">{booking.seats?.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Total Amount</p>
                        <p className="font-bold text-primary text-xl">${booking.total_amount?.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    {booking.status === 'confirmed' && (
                      <Button 
                        onClick={() => handleCancelBooking(booking.id)}
                        variant="destructive"
                        size="sm"
                        className="mt-2"
                        data-testid={`cancel-btn-${booking.id}`}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel Booking
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
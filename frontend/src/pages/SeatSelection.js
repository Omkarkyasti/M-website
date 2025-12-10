import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const SeatSelection = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user, getAuthHeaders } = useAuth();
  const [show, setShow] = useState(null);
  const [movie, setMovie] = useState(null);
  const [theater, setTheater] = useState(null);
  const [seats, setSeats] = useState([]);
  const [price, setPrice] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    if (!user) {
      toast.error('Please login to book tickets');
      navigate('/login');
      return;
    }

    Promise.all([
      axios.get(`${API}/shows/${showId}`),
      axios.get(`${API}/shows/${showId}/seats`)
    ])
      .then(async ([showRes, seatsRes]) => {
        setShow(showRes.data);
        setSeats(seatsRes.data.seats);
        setPrice(seatsRes.data.price);
        
        const [movieRes, theaterRes] = await Promise.all([
          axios.get(`${API}/movies/${showRes.data.movie_id}`),
          axios.get(`${API}/theaters/${showRes.data.theater_id}`)
        ]);
        
        setMovie(movieRes.data);
        setTheater(theaterRes.data);
        setLoading(false);
        
        const wsUrl = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
        const websocket = new WebSocket(`${wsUrl}/ws/seats/${showId}`);
        
        websocket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'seat_update') {
            setSeats(prevSeats => {
              const newSeats = [...prevSeats];
              data.seats.forEach(seatNumber => {
                for (let i = 0; i < newSeats.length; i++) {
                  const seatIndex = newSeats[i].findIndex(s => s.seat_number === seatNumber);
                  if (seatIndex !== -1) {
                    newSeats[i][seatIndex].status = data.status;
                  }
                }
              });
              return newSeats;
            });
          }
        };
        
        setWs(websocket);
      })
      .catch(error => {
        console.error('Error fetching show details:', error);
        toast.error('Failed to load show details');
        setLoading(false);
      });

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [showId, user, navigate]);

  const toggleSeat = (seatNumber, status) => {
    if (status === 'booked') return;
    
    setSelectedSeats(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(s => s !== seatNumber);
      } else {
        return [...prev, seatNumber];
      }
    });
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }

    setBooking(true);
    
    try {
      const response = await axios.post(
        `${API}/bookings`,
        { show_id: showId, seats: selectedSeats },
        { headers: getAuthHeaders() }
      );
      
      const bookingId = response.data.id;
      const originUrl = window.location.origin;
      
      const paymentResponse = await axios.post(
        `${API}/payments/checkout?booking_id=${bookingId}&origin_url=${originUrl}`,
        {},
        { headers: getAuthHeaders() }
      );
      
      window.location.href = paymentResponse.data.url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Booking failed');
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-gray-400">Loading seats...</div>
      </div>
    );
  }

  const totalAmount = selectedSeats.length * price;

  return (
    <div className="min-h-screen pt-32 pb-20 px-8" data-testid="seat-selection-page">
      <div className="noise-texture" />
      <div className="max-w-5xl mx-auto">
        <div className="glass-card-heavy p-8 rounded-xl mb-8">
          <h1 className="text-3xl font-bold uppercase tracking-wide mb-2" data-testid="movie-title">{movie?.title}</h1>
          <p className="text-gray-400">
            {theater?.name} - {show?.date} at {show?.start_time}
          </p>
        </div>
        
        <div className="glass-card p-8 rounded-xl mb-8">
          <div className="mb-8">
            <div className="h-2 bg-gradient-to-b from-primary/50 to-transparent mb-2" />
            <p className="text-center text-sm text-gray-400 uppercase tracking-wider">Screen</p>
          </div>
          
          <div className="flex flex-col gap-4 items-center mb-8">
            {seats.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-3">
                {row.map(seat => (
                  <div
                    key={seat.seat_number}
                    onClick={() => toggleSeat(seat.seat_number, seat.status)}
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xs cursor-pointer transition-all ${
                      selectedSeats.includes(seat.seat_number)
                        ? 'bg-primary border-primary text-black font-bold neon-glow'
                        : seat.status === 'booked'
                        ? 'bg-red-900/20 border-red-900 text-red-900 cursor-not-allowed'
                        : 'bg-transparent border-white/20 text-white hover:border-primary/50 hover:bg-primary/10'
                    }`}
                    data-testid={`seat-${seat.seat_number}`}
                  >
                    {seat.seat_number}
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 border-white/20 bg-transparent" />
              <span className="text-gray-400">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 border-primary bg-primary" />
              <span className="text-gray-400">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 border-red-900 bg-red-900/20" />
              <span className="text-gray-400">Booked</span>
            </div>
          </div>
        </div>
        
        <div className="glass-card-heavy p-8 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-gray-400 mb-1">Selected Seats</p>
              <p className="text-2xl font-bold" data-testid="selected-seats">
                {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-primary" data-testid="total-amount">
                ${totalAmount.toFixed(2)}
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleBooking}
            disabled={selectedSeats.length === 0 || booking}
            className="btn-primary w-full"
            data-testid="proceed-payment-btn"
          >
            {booking ? 'Processing...' : 'Proceed to Payment'}
          </Button>
        </div>
      </div>
    </div>
  );
};
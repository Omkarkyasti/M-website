import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Download, Home } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const BookingSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    const pollPaymentStatus = async (attempts = 0) => {
      const maxAttempts = 5;
      
      if (attempts >= maxAttempts) {
        toast.error('Payment verification timeout. Please check My Bookings.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API}/payments/status/${sessionId}`,
          { headers: getAuthHeaders() }
        );

        if (response.data.payment_status === 'paid') {
          const bookingRes = await axios.get(
            `${API}/bookings/${response.data.booking_id}`,
            { headers: getAuthHeaders() }
          );
          setBooking(bookingRes.data);
          setLoading(false);
          toast.success('Payment successful!');
        } else if (response.data.status === 'expired') {
          toast.error('Payment session expired');
          setLoading(false);
        } else {
          setTimeout(() => pollPaymentStatus(attempts + 1), 2000);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setTimeout(() => pollPaymentStatus(attempts + 1), 2000);
      }
    };

    pollPaymentStatus();
  }, [sessionId, navigate, getAuthHeaders]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Payment verification failed. Please check My Bookings.</p>
          <Button onClick={() => navigate('/my-bookings')} className="btn-primary mt-4">
            Go to My Bookings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-8" data-testid="booking-success-page">
      <div className="noise-texture" />
      <div className="max-w-2xl mx-auto">
        <div className="glass-card-heavy p-12 rounded-xl text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          
          <h1 className="text-3xl font-bold uppercase tracking-wide mb-4" data-testid="success-title">
            Booking Confirmed!
          </h1>
          <p className="text-gray-400 mb-8">Your tickets have been booked successfully</p>
          
          <div className="glass-card p-8 rounded-xl text-left mb-8">
            <div className="grid gap-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Movie</span>
                <span className="font-bold" data-testid="movie-title">{booking.movie?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Theater</span>
                <span className="font-bold">{booking.theater?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Date & Time</span>
                <span className="font-bold">{booking.show?.date} at {booking.show?.start_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Seats</span>
                <span className="font-bold text-primary" data-testid="booked-seats">{booking.seats?.join(', ')}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-4">
                <span className="text-gray-400">Total Amount</span>
                <span className="font-bold text-2xl text-primary" data-testid="total-paid">${booking.total_amount?.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button onClick={() => navigate('/')} variant="outline" className="btn-secondary flex-1" data-testid="home-btn">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
            <Button onClick={() => navigate('/my-bookings')} className="btn-primary flex-1" data-testid="my-bookings-btn">
              View My Bookings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
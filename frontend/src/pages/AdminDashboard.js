import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Film, Theater, Calendar, DollarSign, Ticket, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminDashboard = () => {
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast.error('Access denied');
      navigate('/');
      return;
    }

    axios.get(`${API}/admin/analytics`, { headers: getAuthHeaders() })
      .then(response => {
        setAnalytics(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching analytics:', error);
        toast.error('Failed to load analytics');
        setLoading(false);
      });
  }, [user, navigate, getAuthHeaders]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Movies',
      value: analytics?.total_movies || 0,
      icon: Film,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/20'
    },
    {
      title: 'Total Theaters',
      value: analytics?.total_theaters || 0,
      icon: Theater,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/20'
    },
    {
      title: 'Total Shows',
      value: analytics?.total_shows || 0,
      icon: Calendar,
      color: 'text-green-500',
      bgColor: 'bg-green-500/20'
    },
    {
      title: 'Total Bookings',
      value: analytics?.total_bookings || 0,
      icon: Ticket,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/20'
    },
    {
      title: 'Confirmed Bookings',
      value: analytics?.confirmed_bookings || 0,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/20'
    },
    {
      title: 'Total Revenue',
      value: `$${(analytics?.total_revenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/20'
    }
  ];

  return (
    <div className="min-h-screen pt-32 pb-20 px-8" data-testid="admin-dashboard">
      <div className="noise-texture" />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold uppercase tracking-wide mb-8">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="glass-card p-6 rounded-xl" data-testid={`stat-${index}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-1">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
            );
          })}
        </div>
        
        <div className="glass-card p-8 rounded-xl">
          <h2 className="text-2xl font-bold uppercase tracking-wide mb-6">Quick Actions</h2>
          <p className="text-gray-400 mb-8">
            Admin features for managing movies, theaters, and shows will be available in the full implementation.
            For now, you can use the API directly or add data through backend scripts.
          </p>
          <div className="text-sm text-gray-500">
            <p className="mb-2">API Endpoints:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>POST /api/admin/movies - Create movie</li>
              <li>POST /api/admin/theaters - Create theater</li>
              <li>POST /api/admin/shows - Create show</li>
              <li>GET /api/admin/bookings - View all bookings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
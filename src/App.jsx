import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  X,
  Trash2,
  Grid,
  Columns,
  List
} from 'lucide-react';

// --- CONFIGURATION ---

const ROOMS = [
  "Sanctuary",
  "Social Hall",
  "The Studio on 3",
  "Youth Room",
  "Studio on 4",
  "Classroom",
  "Kitchen",
  "Parlor",
  "Podcast Room"
];

const STAFF = [
  "Jacqui Lewis",
  "Rev. Natalie Renee Perkins",
  "Macky Alston",
  "Rev. Amanda Hambrick Ashcraft",
  "Elise Tiralli",
  "John del Cueto",
  "Zayn D. Silva",
  "Michael Lennon",
  "Joseph Puma"
];

const HOURS = { start: 7, end: 22 };

// --- STORAGE API (using localStorage in the browser) ---

const storage = {
  getReservations: async (room) => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(`reservations:${room}`);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.log('No reservations found for room:', room);
      return [];
    }
  },

  saveReservations: async (room, reservations) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(`reservations:${room}`, JSON.stringify(reservations));
    } catch (error) {
      console.error('Failed to save reservations:', error);
      throw error;
    }
  }
};

// --- HELPER FUNCTIONS ---

const generateTimeSlots = () => {
  const slots = [];
  for (let i = HOURS.start; i < HOURS.end; i++) {
    slots.push(`${i.toString().padStart(2, '0')}:00`);
    slots.push(`${i.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

const getWeekDays = (baseDate) => {
  const labels = [];
  const day = new Date(baseDate);
  const dayOfWeek = day.getDay();
  const diff = day.getDate() - dayOfWeek;
  const startOfWeek = new Date(day.setDate(diff));

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    labels.push(d);
  }
  return labels;
};

const getMonthDays = (baseDate) => {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - startOffset);
  
  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }
  return days;
};

const formatDateForInput = (dateObj) => {
  return dateObj.toISOString().split('T')[0];
};

const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// --- COMPONENTS ---

const Header = ({ title }) => (
  <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="bg-indigo-900 text-white p-2 rounded-lg">
        <Calendar size={24} />
      </div>
      <div>
        <h1 className="text-xl font-bold text-gray-900">Middle Collegiate Church</h1>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </div>
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <span>Booked</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
        <span>Inquiry</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-emerald-50 border border-emerald-200"></div>
        <span>Available</span>
      </div>
    </div>
  </header>
);

const RoomSelector = ({ selectedRoom, onSelect }) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
      Select Space
    </label>
    <select 
      value={selectedRoom} 
      onChange={(e) => onSelect(e.target.value)}
      className="w-full p-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-700"
    >
      {ROOMS.map(room => (
        <option key={room} value={room}>{room}</option>
      ))}
    </select>
  </div>
);

const ViewSwitcher = ({ viewMode, onViewChange }) => (
  <div className="flex p-1 bg-gray-100 rounded-lg mb-4">
    <button
      onClick={() => onViewChange('month')}
      className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-all ${viewMode === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
    >
      <Grid size={14} /> Month
    </button>
    <button
      onClick={() => onViewChange('week')}
      className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-all ${viewMode === 'week' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
    >
      <Columns size={14} /> Week
    </button>
    <button
      onClick={() => onViewChange('day')}
      className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-all ${viewMode === 'day' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
    >
      <List size={14} /> Day
    </button>
  </div>
);

const DateControls = ({ currentDate, onPrev, onNext, onToday, viewMode }) => {
  let dateLabel = '';
  if (viewMode === 'month') {
    dateLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } else if (viewMode === 'day') {
    dateLabel = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } else {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    if (start.getMonth() === end.getMonth()) {
      dateLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      dateLabel = `${start.toLocaleDateString('en-US', { month: 'short' })} - ${end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }
  }

  return (
    <div className="flex items-center justify-between mb-4 bg-gray-50 p-2 rounded-lg border border-gray-200">
      <button onClick={onPrev} className="p-1 hover:bg-white hover:shadow rounded transition-all text-gray-600">
        <ChevronLeft size={20} />
      </button>
      <div className="text-center">
        <span className="block text-sm font-semibold text-gray-900">
          {dateLabel}
        </span>
      </div>
      <div className="flex gap-2">
        <button onClick={onToday} className="text-xs px-3 py-1 bg-white border border-gray-300 rounded font-medium text-gray-600 hover:bg-gray-50">
          Today
        </button>
        <button onClick={onNext} className="p-1 hover:bg-white hover:shadow rounded transition-all text-gray-600">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

const ReservationModal = ({ 
  isOpen, 
  onClose, 
  data, 
  onSave, 
  onDelete,
  saving 
}) => {
  const [formData, setFormData] = useState({
    meetingName: '',
    staffName: STAFF[0],
    status: 'inquiry',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    ...data
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    if (data) setFormData(prev => ({ ...prev, ...data }));
  }, [data]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (timeToMinutes(formData.endTime) <= timeToMinutes(formData.startTime)) {
      setError("End time must be after start time.");
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError("Failed to save reservation. " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">
            {formData.id ? 'Edit Reservation' : 'New Reservation'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCir

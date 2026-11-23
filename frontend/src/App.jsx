import React from 'react';
import { BookingProvider } from './context/BookingContext';
import { AdminProvider } from './context/AdminContext';
import { ProfileProvider } from './context/ProfileContext';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

const App = () => {
  return (
    <AuthProvider>
      <AdminProvider>
        <ProfileProvider>
          <BookingProvider>
            <AppRoutes />
          </BookingProvider>
        </ProfileProvider>
      </AdminProvider>
    </AuthProvider>
  );
};

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from 'react';
import Home from "./pages/Home";
import Services from "./pages/Services";
import Booking from "./pages/Booking";
import GuestBooking from "./pages/GuestBooking";
import Register from "./pages/Register";
import ClientLogin from "./pages/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import Dashboard from "./pages/Dashboard";
import NewAppointment from "./pages/NewAppointment";
import MyAppointments from "./pages/barber/MySchedule";
import ManageAvailability from "./pages/barber/ManageAvailability";
import AdminAppointments from "./pages/admin/Appointments";
import AdminBarbers from "./pages/admin/Barbers";
import AdminServices from "./pages/admin/Services";
import AdminClients from "./pages/admin/Clients";
import { Users as AdminUsers } from "./pages/admin/Users";
import AdminSettings from "./pages/admin/Settings";
import RecurringSchedules from "./pages/admin/RecurringSchedules";
import Finance from "./pages/barber/Finance";
import BarberProfile from "./pages/barber/Profile";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/guest-booking" element={<GuestBooking />} />
            <Route path="/login" element={<ClientLogin />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/new-appointment" element={<ProtectedRoute><NewAppointment /></ProtectedRoute>} />

            <Route path="/my-schedule" element={<ProtectedRoute allowedRoles={['barber', 'admin']}><MyAppointments /></ProtectedRoute>} />
            <Route path="/barber/availability" element={<ProtectedRoute allowedRoles={['barber', 'admin']}><ManageAvailability /></ProtectedRoute>} />
            <Route path="/barber/finance" element={<ProtectedRoute allowedRoles={['barber', 'admin']}><Finance /></ProtectedRoute>} />
            <Route path="/barber/profile" element={<ProtectedRoute allowedRoles={['barber', 'admin']}><BarberProfile /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/appointments" element={<ProtectedRoute allowedRoles={['admin']}><AdminAppointments /></ProtectedRoute>} />
            <Route path="/admin/barbers" element={<ProtectedRoute allowedRoles={['admin']}><AdminBarbers /></ProtectedRoute>} />
            <Route path="/admin/services" element={<ProtectedRoute allowedRoles={['admin']}><AdminServices /></ProtectedRoute>} />
            <Route path="/admin/clients" element={<ProtectedRoute allowedRoles={['admin']}><AdminClients /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/recurring-schedules" element={<ProtectedRoute allowedRoles={['admin', 'barber']}><RecurringSchedules /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

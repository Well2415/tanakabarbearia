import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from 'react';
import { storage } from '@/lib/storage';
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
import { Users as AdminUsers } from "./pages/admin/Users"; // New User Management Page
import AdminReports from "./pages/admin/Reports"; // New Reports Page
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";

// Force re-render


const queryClient = new QueryClient();

const applyDataPatch = () => {
  const users = storage.getUsers();
  let needsUpdate = false;
  const adminUser = users.find(u => u.username === 'admin');
  if (adminUser && adminUser.role !== 'admin') {
    adminUser.role = 'admin';
    needsUpdate = true;
  }
  if (needsUpdate) {
    storage.saveUsers(users);
  }
};

const App = () => {
  useEffect(() => {
    applyDataPatch();
  }, []);

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

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new-appointment" element={<NewAppointment />} />
            
            <Route path="/my-schedule" element={<MyAppointments />} />
            <Route path="/barber/availability" element={<ManageAvailability />} />

            <Route path="/admin/appointments" element={<AdminAppointments />} />
            <Route path="/admin/barbers" element={<AdminBarbers />} />
            <Route path="/admin/services" element={<AdminServices />} />
            <Route path="/admin/clients" element={<AdminClients />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

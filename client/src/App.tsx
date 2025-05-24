import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter } from "react-router-dom";

// Layouts
import MainLayout from "@/layouts/MainLayout";
import AdminLayout from "@/layouts/AdminLayout";

// Auth Pages
import Login from "@/pages/auth/Login";
import OtpVerify from "@/pages/auth/OtpVerify";
import Signup from "@/pages/auth/Signup";

// User Pages
import Home from "@/pages/dashboard/Home";
import Tournaments from "@/pages/tournaments/Tournaments";
import TournamentDetails from "@/pages/tournaments/TournamentDetails";
import MyMatches from "@/pages/matches/MyMatches";
import MatchDetail from "@/pages/matches/MatchDetail";
import Leaderboard from "@/pages/leaderboard/Leaderboard";
import Wallet from "@/pages/wallet/Wallet";
import Profile from "@/pages/profile/Profile";
import KycVerification from "@/pages/profile/KycVerification";
import Squad from "@/pages/squad/Squad";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ManageTournaments from "@/pages/admin/ManageTournaments";
import ManageUsers from "@/pages/admin/ManageUsers";
import ReviewMatches from "@/pages/admin/ReviewMatches";
import KycRequests from "@/pages/admin/KycRequests";

// Error Page
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Auth Pages */}
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/verify-otp" component={OtpVerify} />

      {/* Admin Pages */}
      <Route
        path="/admin"
        component={() => (
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        )}
      />
      <Route
        path="/admin/tournaments"
        component={() => (
          <AdminLayout>
            <ManageTournaments />
          </AdminLayout>
        )}
      />
      <Route
        path="/admin/users"
        component={() => (
          <AdminLayout>
            <ManageUsers />
          </AdminLayout>
        )}
      />
      <Route
        path="/admin/matches"
        component={() => (
          <AdminLayout>
            <ReviewMatches />
          </AdminLayout>
        )}
      />
      <Route
        path="/admin/kyc"
        component={() => (
          <AdminLayout>
            <KycRequests />
          </AdminLayout>
        )}
      />

      {/* User Pages */}
      <Route
        path="/dashboard"
        component={() => (
          <MainLayout>
            <Home />
          </MainLayout>
        )}
      />
      <Route
        path="/tournaments"
        component={() => (
          <MainLayout>
            <Tournaments />
          </MainLayout>
        )}
      />
      <Route
        path="/tournament/:id"
        component={() => (
          <MainLayout>
            <TournamentDetails />
          </MainLayout>
        )}
      />
      <Route
        path="/matches"
        component={() => (
          <MainLayout>
            <MyMatches />
          </MainLayout>
        )}
      />
      <Route
        path="/match/:id"
        component={() => (
          <MainLayout>
            <MatchDetail />
          </MainLayout>
        )}
      />
      <Route
        path="/leaderboard"
        component={() => (
          <MainLayout>
            <Leaderboard />
          </MainLayout>
        )}
      />
      <Route
        path="/wallet"
        component={() => (
          <MainLayout>
            <Wallet />
          </MainLayout>
        )}
      />
      <Route
        path="/profile"
        component={() => (
          <MainLayout>
            <Profile />
          </MainLayout>
        )}
      />
      <Route
        path="/kyc"
        component={() => (
          <MainLayout>
            <KycVerification />
          </MainLayout>
        )}
      />
      <Route
        path="/squad"
        component={() => (
          <MainLayout>
            <Squad />
          </MainLayout>
        )}
      />

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;

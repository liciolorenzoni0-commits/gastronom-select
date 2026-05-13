import { Routes, Route } from "react-router";
import Navigation from "@/components/Navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Evaluate from "./pages/Evaluate";
import CandidateProfile from "./pages/CandidateProfile";
import EvaluationForm from "./pages/EvaluationForm";
import AiSummary from "./pages/AiSummary";
import FeedbackPage from "./pages/FeedbackPage";
import Dashboard from "./pages/Dashboard";
import ClientDashboard from "./pages/ClientDashboard";

export default function App() {
  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/evaluate" element={<Evaluate />} />
        <Route path="/candidate/:token" element={<CandidateProfile />} />
        <Route path="/evaluation/:id" element={<EvaluationForm />} />
        <Route path="/evaluation/:id/summary" element={<AiSummary />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/client/:token" element={<ClientDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

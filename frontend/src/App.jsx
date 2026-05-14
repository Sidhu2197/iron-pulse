import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Workout from './pages/Workout';
import FoodPlan from './pages/FoodPlan';
import Profile from './pages/Profile';
import BMICalculator from './pages/BMICalculator';
import CaloriePredictor from './pages/CaloriePredictor';
import NotFound from './pages/NotFound';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    {/* Protected routes with navbar layout */}
                    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/workout" element={<Workout />} />
                        <Route path="/food-plan" element={<FoodPlan />} />
                        <Route path="/bmi" element={<BMICalculator />} />
                        <Route path="/calorie-predictor" element={<CaloriePredictor />} />
                        <Route path="/profile" element={<Profile />} />
                    </Route>

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

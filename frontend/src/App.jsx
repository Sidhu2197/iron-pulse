import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Cursor from './components/Cursor/Cursor';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Workout = lazy(() => import('./pages/Workout'));
const FoodPlan = lazy(() => import('./pages/FoodPlan'));
const Profile = lazy(() => import('./pages/Profile'));
const BMICalculator = lazy(() => import('./pages/BMICalculator'));
const CaloriePredictor = lazy(() => import('./pages/CaloriePredictor'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <BrowserRouter>
                    {/* Custom cursor — outside router tree per design.md */}
                    <Cursor />

                    <div className="app-container">
                        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>}>
                            <Routes>
                                {/* Public routes */}
                                <Route path="/" element={<Landing />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/signup" element={<Signup />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/reset-password/:token" element={<ResetPassword />} />

                                {/* Protected routes with navbar layout */}
                                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/workout" element={<Workout />} />
                                    <Route path="/food-plan" element={<FoodPlan />} />
                                    <Route path="/bmi" element={<BMICalculator />} />
                                    <Route path="/calorie-predictor" element={<CaloriePredictor />} />
                                    <Route path="/calorie_predictor" element={<CaloriePredictor />} />
                                    <Route path="/profile" element={<Profile />} />
                                </Route>

                                {/* 404 */}
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </Suspense>
                    </div>
                </BrowserRouter>
            </ToastProvider>
        </AuthProvider>
    );
}

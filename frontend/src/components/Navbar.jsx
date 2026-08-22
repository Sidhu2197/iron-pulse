import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Dumbbell, Utensils, BrainCircuit, Scale,
  User, Flame, LogOut, ChevronDown, Keyboard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import { useMacros } from '../context/MacroContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/workout', label: 'Workout', icon: Dumbbell },
  { to: '/food-plan', label: 'Food Plan', icon: Utensils },
  { to: '/calorie-predictor', label: 'Calorie AI', icon: BrainCircuit },
  { to: '/bmi', label: 'BMI', icon: Scale },
];

export default function Navbar({ onOpenShortcuts }) {
  const { user, logout } = useAuth();
  const { foodPlanLoading, workoutPlanLoading, caloriePredictionLoading } = usePlan();
  const { openMacroCalculator } = useMacros();
  const location = useLocation();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  /* ── Pill indicator refs ─────────────────────────────── */
  const navContainerRef = useRef(null);
  const linkRefs = useRef({});
  const pillRef = useRef(null);
  const rafRef = useRef(null);

  /* ── Scroll detection ────────────────────────────────── */
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ── Sliding pill position calculation ───────────────── */
  const updatePill = useCallback(() => {
    const activeLink = linkRefs.current[location.pathname];
    const container = navContainerRef.current;
    const pill = pillRef.current;

    if (!activeLink || !container || !pill) return;

    const containerRect = container.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();

    const offsetX = linkRect.left - containerRect.left;
    const width = linkRect.width;

    pill.style.transform = `translateX(${offsetX}px)`;
    pill.style.width = `${width}px`;
    pill.style.opacity = '1';
  }, [location.pathname]);

  useEffect(() => {
    // Use rAF for smooth measurement after layout
    const measure = () => {
      rafRef.current = requestAnimationFrame(() => {
        updatePill();
      });
    };
    measure();

    // Re-measure on resize
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updatePill]);

  /* ── Close dropdown on outside click ─────────────────── */
  const dropdownRef = useRef(null);
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  /* ── Styles ──────────────────────────────────────────── */
  const navOuter = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: 'flex',
    justifyContent: 'center',
    padding: isScrolled ? '12px 16px' : '0',
    transition: 'padding 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  };

  const navInner = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: isScrolled ? 'min(900px, 92%)' : '100%',
    padding: isScrolled ? '10px 20px' : '14px 32px',
    background: isScrolled
      ? 'rgba(10, 14, 28, 0.7)'
      : 'rgba(10, 14, 28, 0.5)',
    backdropFilter: isScrolled ? 'blur(40px) saturate(1.6)' : 'blur(12px)',
    WebkitBackdropFilter: isScrolled ? 'blur(40px) saturate(1.6)' : 'blur(12px)',
    border: isScrolled
      ? '1px solid rgba(255, 255, 255, 0.08)'
      : '1px solid transparent',
    borderBottom: isScrolled ? undefined : '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: isScrolled ? '9999px' : '0',
    boxShadow: isScrolled
      ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.04) inset'
      : 'none',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  };

  const linkStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: isActive ? 600 : 500,
    color: isActive ? '#00f0ff' : '#94a3b8',
    textDecoration: 'none',
    position: 'relative',
    zIndex: 2,
    transition: 'color 0.25s ease',
  });

  return (
    <div style={navOuter}>
      <nav style={navInner}>
        {/* ── Brand ─────────────────────────────── */}
        <NavLink
          to="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1.125rem',
            letterSpacing: '-0.02em',
            flexShrink: 0,
          }}
        >
          <Flame
            size={22}
            style={{
              color: '#00f0ff',
              filter: 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.4))',
            }}
          />
          <span>Iron Pulse</span>
        </NavLink>

        {/* ── Nav Links with sliding pill ──────── */}
        <div
          ref={navContainerRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            position: 'relative',
          }}
        >
          {/* Sliding pill background */}
          <div
            ref={pillRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '9999px',
              opacity: 0,
              transition: 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), width 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const isGenerating =
              (to === '/workout' && workoutPlanLoading) ||
              (to === '/food-plan' && foodPlanLoading) ||
              ((to === '/calorie-predictor' || to === '/calorie_predictor') && caloriePredictionLoading);
            return (
              <NavLink
                key={to}
                to={to}
                ref={(el) => { linkRefs.current[to] = el; }}
                style={({ isActive }) => linkStyle(isActive)}
              >
                <Icon size={16} />
                <span className="nav-label">{label}</span>
                {isGenerating && (
                  <span
                    title="Generating plan in background..."
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                      boxShadow: '0 0 10px #10b981',
                      animation: 'pulse 1s infinite alternate',
                      marginLeft: 4,
                      display: 'inline-block',
                    }}
                  />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* ── Actions & Profile ───────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* ── Profile Dropdown ─────────────────── */}
          <div ref={dropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'transparent',
              border: 'none',
              borderRadius: '9999px',
              color: '#f1f5f9',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00c8d4, #7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#fff',
                animation: dropdownOpen
                  ? 'profileRingPulse 1.5s ease-in-out infinite'
                  : 'none',
              }}
            >
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <ChevronDown
              size={14}
              style={{
                color: '#94a3b8',
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.25s ease',
              }}
            />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                minWidth: '200px',
                background: 'rgba(14, 18, 36, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                borderRadius: '12px',
                padding: '6px',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04) inset',
                animation: 'slideDown 0.2s ease forwards',
              }}
            >
              {/* User info */}
              <div
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  marginBottom: '4px',
                }}
              >
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9' }}>
                  {user?.username || 'User'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                  {user?.email || ''}
                </div>
              </div>

              {/* Profile link */}
              <NavLink
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                <User size={16} />
                Profile
              </NavLink>

              {/* Macro Targets Button (Below Profile, Above Sign Out) */}
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  openMacroCalculator();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  color: '#00f0ff',
                  fontSize: '0.875rem',
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 240, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Flame size={16} />
                Macro Targets
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  color: '#f87171',
                  fontSize: '0.875rem',
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(248, 113, 113, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>

      {/* ── Responsive mobile styles ────────── */}
      <style>{`
        @media (max-width: 768px) {
          .nav-label { display: none; }
        }
      `}</style>
    </div>
  );
}

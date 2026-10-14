import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './Navbar';
import Silk from './Silk';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import MacroCalculatorModal from './MacroCalculatorModal';
import ChatbotWidget from './ChatbotWidget';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useMacros } from '../context/MacroContext';
import './Layout.css';

const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.45,
            ease: [0.175, 0.885, 0.32, 1.275],
        },
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: {
            duration: 0.25,
            ease: 'easeIn',
        },
    },
};

export default function Layout() {
    const location = useLocation();
    const { hasConfiguredMacros, macrosLoading } = useMacros();
    const { isModalOpen, closeModal, toggleModal } = useKeyboardShortcuts();

    // 1. Loading state while checking macro profile from backend
    if (macrosLoading) {
        return (
            <div className="layout-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', position: 'relative' }}>
                <Silk color="#7B7481" speed={0.4} scale={3.0} />
                <div style={{
                    position: 'relative',
                    zIndex: 10,
                    textAlign: 'center',
                    color: 'var(--text-secondary, #a0a0a0)',
                    fontSize: '0.95rem',
                    letterSpacing: '0.02em',
                    background: 'rgba(18, 18, 20, 0.8)',
                    padding: '24px 36px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        margin: '0 auto 14px',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        borderTopColor: '#ff5722',
                        borderRadius: '50%',
                        animation: 'layoutSpin 0.8s linear infinite'
                    }} />
                    <div>Checking your fitness profile...</div>
                    <style>{`
                        @keyframes layoutSpin {
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    // 2. If macros are not set, trigger macro calculator wizard before anything else.
    // Do NOT show navbar, outlet, chatbot, or any other pages without macros set.
    if (!hasConfiguredMacros) {
        return (
            <div className="layout-wrapper" style={{ minHeight: '100vh', position: 'relative' }}>
                <Silk color="#7B7481" speed={0.4} scale={3.0} />
                <MacroCalculatorModal forceOpen={true} />
            </div>
        );
    }

    // 3. Normal application layout once user has configured macros
    return (
        <div className="layout-wrapper">
            {/* Silk WebGL background — fixed behind all content */}
            <Silk color="#7B7481" speed={0.4} scale={3.0} />

            <Navbar onOpenShortcuts={toggleModal} />

            <main className="layout-main">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            <KeyboardShortcutsModal isOpen={isModalOpen} onClose={closeModal} />
            
            {/* Macro Calculator Modal for voluntary edits/recalculations */}
            <MacroCalculatorModal />

            {/* Floating Chatbot Assistant */}
            <ChatbotWidget />
        </div>
    );
}

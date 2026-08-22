import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './Navbar';
import Silk from './Silk';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import MacroCalculatorModal from './MacroCalculatorModal';
import ChatbotWidget from './ChatbotWidget';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useMacros } from '../context/MacroContext';
import { useAuth } from '../context/AuthContext';
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
    const { user } = useAuth();
    const { shouldShowOnboardingWizard } = useMacros();
    const { isModalOpen, closeModal, toggleModal } = useKeyboardShortcuts();

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
            
            {/* Onboarding wizard ONLY for newly registered users on first login */}
            <MacroCalculatorModal forceOpen={shouldShowOnboardingWizard} />

            {/* Floating Chatbot Assistant */}
            <ChatbotWidget />
        </div>
    );
}

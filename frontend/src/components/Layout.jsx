import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './Navbar';
import Silk from './Silk';
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

    return (
        <div className="layout-wrapper">
            {/* Silk WebGL background — fixed behind all content */}
            <Silk color="#7B7481" speed={0.4} scale={3.0} />

            <Navbar />

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
        </div>
    );
}

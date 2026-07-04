import { motion } from 'framer-motion';

export default function ScrollReveal({ children, className = '', delay = 0, yOffset = 30 }) {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: yOffset, filter: 'blur(5px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: false, amount: 0.15, margin: "0px 0px -50px 0px" }}
            transition={{ duration: 0.6, delay, ease: 'easeOut' }}
        >
            {children}
        </motion.div>
    );
}

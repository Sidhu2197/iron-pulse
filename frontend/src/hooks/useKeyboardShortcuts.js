import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => setIsModalOpen((prev) => !prev);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const targetTag = e.target.tagName.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select' || e.target.isContentEditable;

      // 1. ESC KEY (Global - works everywhere)
      if (e.key === 'Escape') {
        if (isModalOpen) {
          setIsModalOpen(false);
          e.preventDefault();
          return;
        }
        if (document.activeElement && document.activeElement !== document.body) {
          document.activeElement.blur();
          e.preventDefault();
        }
        return;
      }

      // 2. SHORTCUTS HELP MODAL TOGGLE (? or Shift + /)
      if ((e.key === '?' || (e.shiftKey && e.key === '/')) && !isInput) {
        e.preventDefault();
        setIsModalOpen((prev) => !prev);
        return;
      }

      // 3. ENTER KEY handling in forms/inputs (submit on Enter is standard, but Ctrl+Enter forces submit anywhere inside form)
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        const activeEl = document.activeElement;
        if (activeEl && activeEl.form) {
          e.preventDefault();
          activeEl.form.requestSubmit ? activeEl.form.requestSubmit() : activeEl.form.submit();
        }
        return;
      }

      // 4. NAVIGATION SHORTCUTS (Alt + Key) - ignored inside text inputs
      if (e.altKey && !isInput) {
        const key = e.key.toLowerCase();
        switch (key) {
          case 'd':
            e.preventDefault();
            navigate('/dashboard');
            break;
          case 'w':
            e.preventDefault();
            navigate('/workout');
            break;
          case 'f':
            e.preventDefault();
            navigate('/food-plan');
            break;
          case 'c':
            e.preventDefault();
            navigate('/calorie-predictor');
            break;
          case 'b':
            e.preventDefault();
            navigate('/bmi');
            break;
          case 'p':
            e.preventDefault();
            navigate('/profile');
            break;
          case 'h':
            e.preventDefault();
            setIsModalOpen((prev) => !prev);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, isModalOpen]);

  return { isModalOpen, toggleModal, closeModal };
}

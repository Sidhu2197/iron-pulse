import { Keyboard, X } from 'lucide-react';
import './KeyboardShortcutsModal.css';

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['Enter'], action: 'Submit active form or trigger focused button' },
    { keys: ['Esc'], action: 'Close dialogs, popups, or clear field focus' },
    { keys: ['Ctrl', 'Enter'], action: 'Force submit form from any input' },
    { keys: ['?'], action: 'Open / close this Keyboard Shortcuts guide' },
    { keys: ['Alt', 'D'], action: 'Navigate to Dashboard' },
    { keys: ['Alt', 'W'], action: 'Navigate to Workout Plan' },
    { keys: ['Alt', 'F'], action: 'Navigate to Food Plan' },
    { keys: ['Alt', 'M'], action: 'Open Macro Calculator' },
    { keys: ['Alt', 'C'], action: 'Navigate to AI Calorie Predictor' },
    { keys: ['Alt', 'B'], action: 'Navigate to BMI Calculator' },
    { keys: ['Alt', 'P'], action: 'Navigate to Profile' },
  ];

  return (
    <div className="kb-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="kb-modal-title">
      <div className="kb-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="kb-modal-header">
          <div className="kb-modal-title" id="kb-modal-title">
            <Keyboard size={22} />
            <span>Keyboard Shortcuts</span>
          </div>
          <button className="kb-close-btn" onClick={onClose} aria-label="Close keyboard shortcuts modal">
            <X size={20} />
          </button>
        </div>

        <div className="kb-grid">
          {shortcuts.map((item, idx) => (
            <div key={idx} className="kb-row">
              <span className="kb-action">{item.action}</span>
              <div className="kb-keys">
                {item.keys.map((k, i) => (
                  <kbd key={i}>{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="kb-modal-footer">
          Press <kbd>Esc</kbd> anytime to close this popup.
        </div>
      </div>
    </div>
  );
}

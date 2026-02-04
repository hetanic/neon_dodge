"use client";

import { COLORS } from "@/lib/constants";

interface SettingsModalProps {
    onClose: () => void;
    hapticsEnabled: boolean;
    onToggleHaptics: (enabled: boolean) => void;
    onResetBestScore: () => void;
}

export default function SettingsModal({
    onClose,
    hapticsEnabled,
    onToggleHaptics,
    onResetBestScore,
}: SettingsModalProps) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Settings</h2>
                    <button className="close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="modal-content">
                    <div className="setting-row">
                        <span className="setting-label">🔔 Sound</span>
                        <span className="setting-value coming-soon">Coming Soon</span>
                    </div>

                    <div className="setting-row">
                        <span className="setting-label">📳 Haptics</span>
                        <button
                            className={`toggle-btn ${hapticsEnabled ? "active" : ""}`}
                            onClick={() => onToggleHaptics(!hapticsEnabled)}
                        >
                            {hapticsEnabled ? "ON" : "OFF"}
                        </button>
                    </div>

                    <hr className="divider" />

                    <button className="danger-btn" onClick={onResetBestScore}>
                        🗑️ Reset Best Score
                    </button>
                </div>
            </div>

            <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          backdrop-filter: blur(5px);
        }

        .modal {
          background: ${COLORS.darkGray};
          border-radius: 16px;
          width: 90%;
          max-width: 340px;
          overflow: hidden;
          border: 1px solid ${COLORS.mediumGray};
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid ${COLORS.mediumGray};
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          color: ${COLORS.white};
        }

        .close-btn {
          width: 36px;
          height: 36px;
          border-radius: 18px;
          border: none;
          background: ${COLORS.mediumGray};
          color: ${COLORS.white};
          font-size: 18px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .close-btn:hover {
          background: ${COLORS.danger};
        }

        .modal-content {
          padding: 20px;
        }

        .setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
        }

        .setting-label {
          font-size: 16px;
          color: ${COLORS.white};
        }

        .setting-value {
          font-size: 14px;
          color: ${COLORS.white};
        }

        .setting-value.coming-soon {
          color: rgba(255, 255, 255, 0.4);
          font-style: italic;
        }

        .toggle-btn {
          padding: 8px 20px;
          font-size: 14px;
          font-weight: bold;
          border: 2px solid ${COLORS.mediumGray};
          border-radius: 20px;
          background: transparent;
          color: ${COLORS.white};
          cursor: pointer;
          transition: all 0.2s;
          min-width: 70px;
        }

        .toggle-btn.active {
          background: ${COLORS.primary};
          border-color: ${COLORS.primary};
          color: ${COLORS.background};
        }

        .divider {
          border: none;
          border-top: 1px solid ${COLORS.mediumGray};
          margin: 16px 0;
        }

        .danger-btn {
          width: 100%;
          padding: 14px;
          font-size: 14px;
          font-weight: bold;
          border: 2px solid ${COLORS.danger};
          border-radius: 8px;
          background: transparent;
          color: ${COLORS.danger};
          cursor: pointer;
          transition: all 0.2s;
        }

        .danger-btn:hover {
          background: ${COLORS.danger};
          color: ${COLORS.white};
        }
      `}</style>
        </div>
    );
}

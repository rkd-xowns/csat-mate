// src/components/sat_simulator/MuteButton.tsx
import React from 'react';

interface MuteButtonProps {
  isMuted: boolean;
  onToggle: () => void;
}

const MuteButton: React.FC<MuteButtonProps> = ({ isMuted, onToggle }) => {
  return (
    <button onClick={onToggle} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
      {isMuted ? '🔇' : '🔊'}
    </button>
  );
};

export default MuteButton;
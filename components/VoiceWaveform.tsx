import React from 'react';

interface VoiceWaveformProps {
  isRecording: boolean;
  audioLevel: number;
  className?: string;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({ 
  isRecording, 
  audioLevel, 
  className = '' 
}) => {
  // 生成波形条
  const generateBars = () => {
    const bars = [];
    const barCount = 5;
    
    for (let i = 0; i < barCount; i++) {
      // 根据音频电平和录音状态计算每个条的高度
      let height = 4; // 最小高度
      
      if (isRecording) {
        // 录音时，根据音频电平和位置计算高度
        const baseHeight = 4 + audioLevel * 20;
        const variation = Math.sin((Date.now() / 200) + i * 0.5) * 3;
        height = Math.max(4, baseHeight + variation);
      }
      
      bars.push(
        <div
          key={i}
          className={`bg-current transition-all duration-150 ease-in-out rounded-full ${
            isRecording ? 'opacity-100' : 'opacity-40'
          }`}
          style={{
            width: '3px',
            height: `${height}px`,
            animationDelay: `${i * 100}ms`
          }}
        />
      );
    }
    
    return bars;
  };

  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      {generateBars()}
    </div>
  );
}; 
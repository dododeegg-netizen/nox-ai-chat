'use client';

import React, { useState } from 'react';
import { useRealtimeASR } from '@/hooks/useRealtimeASR';

interface RealtimeASRProps {
  onFinalResult?: (text: string) => void;
  className?: string;
}

export const RealtimeASR: React.FC<RealtimeASRProps> = ({ 
  onFinalResult, 
  className = '' 
}) => {
  const [transcript, setTranscript] = useState('');
  
  const {
    isListening,
    status,
    partialText,
    finalText,
    audioLevel,
    error,
    startListening,
    stopListening
  } = useRealtimeASR({
    onPartialResult: (text) => {
      console.log('📝 部分识别结果:', text);
    },
    onFinalResult: (text) => {
      console.log('✅ 最终识别结果:', text);
      setTranscript(prev => prev + text + ' ');
      onFinalResult?.(text);
    },
    onError: (error) => {
      console.error('❌ 识别错误:', error);
    }
  });

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const clearTranscript = () => {
    setTranscript('');
  };

  const getStatusColor = () => {
    switch (status) {
      case 'starting': return 'text-yellow-500';
      case 'listening': return 'text-green-500';
      case 'stopping': return 'text-blue-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'starting': return '启动中...';
      case 'listening': return '正在监听';
      case 'stopping': return '停止中...';
      case 'error': return '连接错误';
      default: return '待机';
    }
  };

  return (
    <div className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          🎤 实时语音识别 (Paraformer)
        </h3>
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={handleToggleListening}
          disabled={status === 'starting' || status === 'stopping'}
          className={`
            flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200
            ${isListening 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            }
            ${(status === 'starting' || status === 'stopping') ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
          `}
        >
          {isListening ? (
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          )}
        </button>

        <button
          onClick={clearTranscript}
          className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          清空文本
        </button>
      </div>

      {/* 音频电平指示器 */}
      {isListening && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>音频电平:</span>
            <span>{Math.round(audioLevel * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${audioLevel * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* 实时识别结果显示 */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-[120px]">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          识别结果:
        </div>
        
        {/* 历史文本 */}
        {transcript && (
          <div className="text-gray-900 dark:text-white mb-2">
            {transcript}
          </div>
        )}
        
        {/* 当前部分识别结果 */}
        {partialText && (
          <div className="text-blue-600 dark:text-blue-400 opacity-75 italic">
            {partialText}
          </div>
        )}
        
        {/* 提示文本 */}
        {!transcript && !partialText && (
          <div className="text-gray-400 dark:text-gray-600 italic">
            {isListening 
              ? '正在监听，请开始说话...' 
              : '点击麦克风按钮开始实时语音识别'
            }
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="text-red-700 dark:text-red-400 text-sm">
            ❌ {error}
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        💡 使用 Paraformer-realtime-v2 模型进行实时语音识别，支持边说边出文字。
        <br />
        🎯 识别结果将实时显示，蓝色文字为临时结果，黑色文字为确认结果。
      </div>
    </div>
  );
}; 
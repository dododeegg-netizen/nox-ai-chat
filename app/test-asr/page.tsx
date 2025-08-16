"use client";

import { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useRealtimeASR } from '@/hooks/useRealtimeASR';

export default function TestASR() {
  const [result, setResult] = useState<string>('');
  
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
    onPartialResult: (text: string) => {
      console.log('部分结果:', text);
    },
    onFinalResult: (text: string) => {
      console.log('最终结果:', text);
      setResult(prev => prev + ' ' + text);
    },
    onError: (error: string) => {
      console.error('ASR错误:', error);
    }
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">实时语音识别测试</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-lg">
          {/* 控制按钮 */}
          <div className="flex justify-center mb-6">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              {isListening ? '停止录音' : '开始录音'}
            </button>
          </div>

          {/* 状态显示 */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              状态: <span className="font-medium">{status}</span>
            </p>
            {isListening && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">音频电平:</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${audioLevel * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 实时结果 */}
          {partialText && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">实时识别:</p>
              <p className="text-blue-800">{partialText}</p>
            </div>
          )}

          {/* 最终结果 */}
          {finalText && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">最终结果:</p>
              <p className="text-green-800">{finalText}</p>
            </div>
          )}

          {/* 累积结果 */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 font-medium mb-2">累积结果:</p>
            <div className="min-h-[100px] p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-800">{result || '还没有识别结果...'}</p>
            </div>
          </div>

          {/* 错误显示 */}
          {error && (
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600 font-medium">错误:</p>
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* 清空按钮 */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setResult('')}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm"
            >
              清空结果
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
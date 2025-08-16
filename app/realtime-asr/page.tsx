'use client';

import React, { useState } from 'react';
import { RealtimeASR } from '@/components/RealtimeASR';

export default function RealtimeASRPage() {
  const [finalResults, setFinalResults] = useState<string[]>([]);

  const handleFinalResult = (text: string) => {
    setFinalResults(prev => [...prev, text]);
  };

  const clearResults = () => {
    setFinalResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎤 Paraformer 实时语音识别
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            基于阿里云百炼 Paraformer-realtime-v2 模型的实时语音识别演示
          </p>
        </div>

        {/* 实时语音识别组件 */}
        <div className="mb-8">
          <RealtimeASR 
            onFinalResult={handleFinalResult}
            className="w-full"
          />
        </div>

        {/* 识别结果历史 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              📝 识别结果历史
            </h2>
            <button
              onClick={clearResults}
              className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              清空历史
            </button>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {finalResults.length === 0 ? (
              <div className="text-gray-400 dark:text-gray-600 italic text-center py-8">
                暂无识别结果，请开始语音识别...
              </div>
            ) : (
              finalResults.map((result, index) => (
                <div 
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border-l-4 border-blue-500"
                >
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    结果 #{index + 1} - {new Date().toLocaleTimeString()}
                  </div>
                  <div className="text-gray-900 dark:text-white">
                    {result}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 功能说明 */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            🔧 功能特性
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <h4 className="font-medium mb-2">✨ 实时识别</h4>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• 边说边出文字，实时显示识别结果</li>
                <li>• 支持部分结果和最终结果</li>
                <li>• 音频电平实时监控</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">🎯 技术特点</h4>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• 使用 Paraformer-realtime-v2 模型</li>
                <li>• 支持标点符号预测</li>
                <li>• 文本反归一化处理</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-4">
            📖 使用说明
          </h3>
          <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-2">
            <p><strong>1. 开始识别:</strong> 点击蓝色麦克风按钮开始实时语音识别</p>
            <p><strong>2. 语音输入:</strong> 对着麦克风说话，观察音频电平指示器</p>
            <p><strong>3. 实时结果:</strong> 蓝色斜体文字显示临时识别结果</p>
            <p><strong>4. 确认结果:</strong> 黑色文字显示确认的识别结果</p>
            <p><strong>5. 停止识别:</strong> 点击红色停止按钮结束识别</p>
          </div>
        </div>

        {/* 返回主页链接 */}
        <div className="mt-8 text-center">
          <a 
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            ← 返回主页
          </a>
        </div>
      </div>
    </div>
  );
} 
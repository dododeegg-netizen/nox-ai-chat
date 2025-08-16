import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 历史记录存储目录
const HISTORY_DIR = path.join(process.cwd(), 'data', 'history');

// 获取所有IP的历史记录概览
export async function GET(request: NextRequest) {
  try {
    console.log('📊 获取所有IP历史记录概览');

    if (!fs.existsSync(HISTORY_DIR)) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0
      });
    }

    const files = fs.readdirSync(HISTORY_DIR);
    const historyOverview: any[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(HISTORY_DIR, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const data = JSON.parse(fileContent);

          // 清理IP地址（从文件名恢复）
          const ip = file.replace('.json', '').replace(/_/g, '.');
          
          historyOverview.push({
            ip: data.ip || ip,
            messageCount: data.messageCount || 0,
            lastUpdated: data.lastUpdated,
            firstMessage: data.messages?.[0]?.timestamp,
            lastMessage: data.messages?.[data.messages.length - 1]?.timestamp,
            hasMessages: (data.messages || []).length > 0
          });
        } catch (error) {
          console.error(`❌ 解析文件失败 ${file}:`, error);
        }
      }
    }

    // 按最后更新时间排序
    historyOverview.sort((a, b) => 
      new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime()
    );

    return NextResponse.json({
      success: true,
      data: historyOverview,
      total: historyOverview.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 获取历史记录概览失败:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get history overview'
    }, { status: 500 });
  }
} 
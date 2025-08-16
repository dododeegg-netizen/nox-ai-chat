import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 历史记录存储目录
const HISTORY_DIR = path.join(process.cwd(), 'data', 'history');

// 确保目录存在
function ensureDirectoryExists() {
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }
}

// 获取IP对应的历史记录文件路径
function getHistoryFilePath(ip: string) {
  // 清理IP地址，用于文件名
  const cleanIP = ip.replace(/[^a-zA-Z0-9.-]/g, '_');
  return path.join(HISTORY_DIR, `${cleanIP}.json`);
}

// 获取客户端IP
function getClientIP(request: NextRequest): string {
  let clientIP = 
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.ip ||
    'unknown';

  if (clientIP.includes(',')) {
    clientIP = clientIP.split(',')[0].trim();
  }

  if (clientIP === 'unknown' || clientIP === '127.0.0.1' || clientIP === '::1') {
    clientIP = 'localhost';
  }

  return clientIP;
}

// GET: 获取历史记录
export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const searchParams = request.nextUrl.searchParams;
    const requestedIP = searchParams.get('ip') || clientIP;

    console.log('📖 获取历史记录 - IP:', requestedIP);

    ensureDirectoryExists();
    const filePath = getHistoryFilePath(requestedIP);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({
        success: true,
        ip: requestedIP,
        messages: [],
        total: 0
      });
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    return NextResponse.json({
      success: true,
      ip: requestedIP,
      messages: data.messages || [],
      total: (data.messages || []).length,
      lastUpdated: data.lastUpdated
    });

  } catch (error) {
    console.error('❌ 获取历史记录失败:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get history'
    }, { status: 500 });
  }
}

// POST: 保存消息到历史记录
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const body = await request.json();
    const { messages, ip } = body;

    const targetIP = ip || clientIP;
    console.log('💾 保存历史记录 - IP:', targetIP, '消息数量:', messages?.length || 0);

    ensureDirectoryExists();
    const filePath = getHistoryFilePath(targetIP);

    const historyData = {
      ip: targetIP,
      messages: messages || [],
      lastUpdated: new Date().toISOString(),
      messageCount: (messages || []).length
    };

    fs.writeFileSync(filePath, JSON.stringify(historyData, null, 2), 'utf8');

    return NextResponse.json({
      success: true,
      ip: targetIP,
      saved: (messages || []).length,
      timestamp: historyData.lastUpdated
    });

  } catch (error) {
    console.error('❌ 保存历史记录失败:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save history'
    }, { status: 500 });
  }
}

// DELETE: 清空历史记录
export async function DELETE(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const searchParams = request.nextUrl.searchParams;
    const targetIP = searchParams.get('ip') || clientIP;

    console.log('🗑️ 清空历史记录 - IP:', targetIP);

    const filePath = getHistoryFilePath(targetIP);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return NextResponse.json({
      success: true,
      ip: targetIP,
      message: 'History cleared'
    });

  } catch (error) {
    console.error('❌ 清空历史记录失败:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to clear history'
    }, { status: 500 });
  }
} 
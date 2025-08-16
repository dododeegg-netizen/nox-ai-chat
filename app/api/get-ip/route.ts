import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 获取客户端IP地址
    let clientIP = 
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      request.ip ||
      'unknown';

    // 处理代理情况下的多个IP
    if (clientIP.includes(',')) {
      clientIP = clientIP.split(',')[0].trim();
    }

    // 本地开发环境处理
    if (clientIP === 'unknown' || clientIP === '127.0.0.1' || clientIP === '::1') {
      clientIP = 'localhost';
    }

    console.log('🌍 客户端IP:', clientIP);

    return NextResponse.json({
      success: true,
      ip: clientIP,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 获取IP地址失败:', error);
    return NextResponse.json({
      success: false,
      ip: 'unknown',
      error: 'Failed to get IP address'
    }, { status: 500 });
  }
} 
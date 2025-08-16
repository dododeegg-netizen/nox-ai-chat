import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 话题存储目录
const TOPICS_DIR = path.join(process.cwd(), 'data', 'topics');

// 话题接口定义
interface Topic {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  preview: string; // 第一条用户消息的预览
  messages: any[];
}

// 确保目录存在
function ensureDirectoryExists() {
  if (!fs.existsSync(TOPICS_DIR)) {
    fs.mkdirSync(TOPICS_DIR, { recursive: true });
  }
}

// 获取IP对应的话题文件路径
function getTopicsFilePath(ip: string) {
  const cleanIP = ip.replace(/[^a-zA-Z0-9.-]/g, '_');
  return path.join(TOPICS_DIR, `${cleanIP}_topics.json`);
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

// 生成话题标题
function generateTopicTitle(messages: any[]): string {
  if (!messages || messages.length === 0) {
    return '空对话';
  }

  // 找到第一条用户消息
  const firstUserMessage = messages.find(msg => msg.type === 'user');
  if (!firstUserMessage) {
    return '空对话';
  }

  const content = firstUserMessage.content || '';
  // 提取前20个字符作为标题，去除换行符
  const title = content.replace(/\n+/g, ' ').substring(0, 20);
  return title.length < content.length ? title + '...' : title;
}

// 生成预览文本
function generatePreview(messages: any[]): string {
  const firstUserMessage = messages.find(msg => msg.type === 'user');
  if (!firstUserMessage) {
    return '暂无内容';
  }

  const content = firstUserMessage.content || '';
  return content.replace(/\n+/g, ' ').substring(0, 50);
}

// GET: 获取话题列表
export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const searchParams = request.nextUrl.searchParams;
    const requestedIP = searchParams.get('ip') || clientIP;

    console.log('📚 获取话题列表 - IP:', requestedIP);

    ensureDirectoryExists();
    const filePath = getTopicsFilePath(requestedIP);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({
        success: true,
        ip: requestedIP,
        topics: [],
        total: 0
      });
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    return NextResponse.json({
      success: true,
      ip: requestedIP,
      topics: data.topics || [],
      total: (data.topics || []).length
    });

  } catch (error) {
    console.error('❌ 获取话题列表失败:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get topics'
    }, { status: 500 });
  }
}

// POST: 保存新话题
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const body = await request.json();
    const { messages, ip } = body;

    const targetIP = ip || clientIP;
    console.log('💾 保存新话题 - IP:', targetIP, '消息数量:', messages?.length || 0);

    // 如果没有消息，不保存
    if (!messages || messages.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No messages to save'
      }, { status: 400 });
    }

    ensureDirectoryExists();
    const filePath = getTopicsFilePath(targetIP);

    // 读取现有话题
    let existingData: { topics: Topic[] } = { topics: [] };
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      existingData = JSON.parse(fileContent);
    }

    // 创建新话题
    const newTopic: Topic = {
      id: Date.now().toString(),
      title: generateTopicTitle(messages),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: messages.length,
      preview: generatePreview(messages),
      messages: messages
    };

    // 添加到话题列表开头
    existingData.topics.unshift(newTopic);

    // 限制最多保存50个话题
    if (existingData.topics.length > 50) {
      existingData.topics = existingData.topics.slice(0, 50);
    }

    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf8');

    return NextResponse.json({
      success: true,
      ip: targetIP,
      topicId: newTopic.id,
      title: newTopic.title,
      saved: messages.length
    });

  } catch (error) {
    console.error('❌ 保存话题失败:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save topic'
    }, { status: 500 });
  }
}

// DELETE: 删除指定话题
export async function DELETE(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const searchParams = request.nextUrl.searchParams;
    const targetIP = searchParams.get('ip') || clientIP;
    const topicId = searchParams.get('topicId');

    if (!topicId) {
      // 如果没有指定话题ID，清空所有话题
      console.log('🗑️ 清空所有话题 - IP:', targetIP);
      
      const filePath = getTopicsFilePath(targetIP);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return NextResponse.json({
        success: true,
        ip: targetIP,
        message: 'All topics cleared'
      });
    } else {
      // 删除指定话题
      console.log('🗑️ 删除话题 - IP:', targetIP, 'TopicID:', topicId);
      
      const filePath = getTopicsFilePath(targetIP);
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({
          success: false,
          error: 'No topics found'
        }, { status: 404 });
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(fileContent);

      // 过滤掉指定话题
      const originalCount = (data.topics || []).length;
      data.topics = (data.topics || []).filter((topic: Topic) => topic.id !== topicId);
      
      if (data.topics.length === originalCount) {
        return NextResponse.json({
          success: false,
          error: 'Topic not found'
        }, { status: 404 });
      }

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

      return NextResponse.json({
        success: true,
        ip: targetIP,
        topicId: topicId,
        message: 'Topic deleted'
      });
    }

  } catch (error) {
    console.error('❌ 删除话题失败:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete topic'
    }, { status: 500 });
  }
} 
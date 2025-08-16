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
  preview: string;
  messages: any[];
}

// 获取IP对应的话题文件路径
function getTopicsFilePath(ip: string) {
  const cleanIP = ip.replace(/[^a-zA-Z0-9.-]/g, '_');
  return path.join(TOPICS_DIR, `${cleanIP}_topics.json`);
}

// 读取话题数据
function readTopicsData(ip: string): Topic[] {
  const filePath = getTopicsFilePath(ip);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(data);
    return parsed.topics || [];
  } catch (error) {
    console.error('读取话题数据失败:', error);
    return [];
  }
}

// GET: 获取单个话题详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const topicId = params.id;
    const ip = request.nextUrl.searchParams.get('ip');
    
    if (!ip) {
      return NextResponse.json({ 
        success: false, 
        error: 'IP地址是必需的' 
      }, { status: 400 });
    }

    console.log('📖 获取单个话题 - IP:', ip, 'Topic ID:', topicId);

    const topics = readTopicsData(ip);
    const topic = topics.find(t => t.id === topicId);

    if (!topic) {
      return NextResponse.json({ 
        success: false, 
        error: '话题不存在' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      topic: topic
    });

  } catch (error) {
    console.error('获取话题失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '获取话题失败' 
    }, { status: 500 });
  }
} 
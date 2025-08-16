import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { writeFile, mkdir, readdir, unlink, stat } from 'fs/promises';

const SAMPLES_DIR = path.join(process.cwd(), 'public', 'voice-samples');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FORMATS = ['mp3', 'wav', 'flac', 'm4a'];

// 确保样音目录存在
async function ensureSamplesDir() {
  try {
    await mkdir(SAMPLES_DIR, { recursive: true });
  } catch (error) {
    console.error('创建样音目录失败:', error);
  }
}

// 上传样音文件
export async function POST(request: NextRequest) {
  try {
    await ensureSamplesDir();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string || file.name;

    if (!file) {
      return NextResponse.json({ error: '没有选择文件' }, { status: 400 });
    }

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `文件太大，最大支持 ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 });
    }

    // 检查文件格式
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !ALLOWED_FORMATS.includes(extension)) {
      return NextResponse.json({ 
        error: `不支持的文件格式，支持: ${ALLOWED_FORMATS.join(', ')}` 
      }, { status: 400 });
    }

    // 生成安全的文件名
    const timestamp = Date.now();
    const safeFileName = `${timestamp}_${name.replace(/[^a-zA-Z0-9.-]/g, '_')}.${extension}`;
    const filePath = path.join(SAMPLES_DIR, safeFileName);

    // 保存文件
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, new Uint8Array(bytes));

    console.log('样音文件上传成功:', safeFileName);

    return NextResponse.json({
      success: true,
      filename: safeFileName,
      path: `/voice-samples/${safeFileName}`,
      size: file.size,
      format: extension,
      uploaded_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('上传样音文件错误:', error);
    return NextResponse.json({ 
      error: '上传文件失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 获取样音文件列表
export async function GET() {
  try {
    await ensureSamplesDir();

    const files = await readdir(SAMPLES_DIR);
    const samples = [];

    for (const file of files) {
      const filePath = path.join(SAMPLES_DIR, file);
      try {
        const stats = await stat(filePath);
        const extension = file.split('.').pop()?.toLowerCase();
        
        if (extension && ALLOWED_FORMATS.includes(extension)) {
          samples.push({
            filename: file,
            path: `/voice-samples/${file}`,
            size: stats.size,
            format: extension,
            created_at: stats.birthtime.toISOString(),
            modified_at: stats.mtime.toISOString()
          });
        }
      } catch (error) {
        console.error(`获取文件信息失败 ${file}:`, error);
      }
    }

    // 按创建时间倒序排列
    samples.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      samples,
      total: samples.length,
      max_file_size: MAX_FILE_SIZE,
      allowed_formats: ALLOWED_FORMATS
    });

  } catch (error) {
    console.error('获取样音文件列表错误:', error);
    return NextResponse.json({ 
      error: '获取文件列表失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 删除样音文件
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: '缺少文件名' }, { status: 400 });
    }

    // 安全检查：确保文件名不包含路径遍历
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: '非法文件名' }, { status: 400 });
    }

    const filePath = path.join(SAMPLES_DIR, filename);
    
    // 检查文件是否存在
    try {
      await stat(filePath);
    } catch (error) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    // 删除文件
    await unlink(filePath);

    console.log('样音文件删除成功:', filename);

    return NextResponse.json({
      success: true,
      message: '文件删除成功',
      filename
    });

  } catch (error) {
    console.error('删除样音文件错误:', error);
    return NextResponse.json({ 
      error: '删除文件失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');

    if (!taskId) {
      return NextResponse.json({ error: '缺少任务ID' }, { status: 400 });
    }

    // 查询异步任务状态
    const response = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('查询任务状态失败:', response.status, errorText);
      return NextResponse.json({ 
        error: `查询任务失败: ${response.status}`,
        details: errorText
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('任务状态查询结果:', result);

    if (result.task_status === 'SUCCEEDED' && result.output?.audio_url) {
      // 任务完成，下载音频文件
      const audioResponse = await fetch(result.output.audio_url);
      if (audioResponse.ok) {
        const audioBuffer = await audioResponse.arrayBuffer();
        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.byteLength.toString()
          }
        });
      }
    }

    // 返回任务状态
    return NextResponse.json({
      task_id: taskId,
      status: result.task_status,
      progress: result.progress || 0,
      message: getStatusMessage(result.task_status)
    });

  } catch (error) {
    console.error('查询任务状态错误:', error);
    return NextResponse.json({ 
      error: '查询任务状态异常',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'PENDING':
      return '任务等待中...';
    case 'RUNNING':
      return '正在生成语音...';
    case 'SUCCEEDED':
      return '语音生成完成';
    case 'FAILED':
      return '语音生成失败';
    default:
      return '未知状态';
  }
} 
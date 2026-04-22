import { NextRequest, NextResponse } from 'next/server'
import { getQuestionnaireById } from '@/lib/db/questionnaires'
import { generateQRCodeBuffer } from '@/lib/qrcode'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const questionnaire = await getQuestionnaireById(id)

    if (!questionnaire) {
      return NextResponse.json({ error: '问卷不存在' }, { status: 404 })
    }

    if (!questionnaire.external_url) {
      return NextResponse.json({ error: '问卷链接不存在' }, { status: 400 })
    }

    const qrBuffer = await generateQRCodeBuffer(questionnaire.external_url)

    return new NextResponse(new Uint8Array(qrBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('生成二维码失败:', error)
    return NextResponse.json({ error: '生成二维码失败' }, { status: 500 })
  }
}

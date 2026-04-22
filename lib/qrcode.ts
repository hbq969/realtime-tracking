/**
 * 二维码生成工具
 */
import QRCode from 'qrcode'

/**
 * 生成二维码图片 Buffer
 */
export async function generateQRCodeBuffer(url: string): Promise<Buffer> {
  return await QRCode.toBuffer(url, {
    type: 'png',
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  })
}

/**
 * 生成二维码 Base64 字符串
 */
export async function generateQRCodeBase64(url: string): Promise<string> {
  const buffer = await generateQRCodeBuffer(url)
  return `data:image/png;base64,${buffer.toString('base64')}`
}

/**
 * 生成二维码 Data URL（用于前端显示）
 */
export async function generateQRCodeDataUrl(url: string): Promise<string> {
  return await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  })
}

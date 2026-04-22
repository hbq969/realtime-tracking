/**
 * 本地文件存储模块
 */
import fs from 'fs/promises'
import path from 'path'

const STORAGE_DIR = path.join(process.cwd(), 'uploads')

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

export async function saveFile(
  category: string,
  filename: string,
  data: Buffer | string
): Promise<string> {
  const dir = path.join(STORAGE_DIR, category)
  await ensureDir(dir)
  const filepath = path.join(dir, filename)
  await fs.writeFile(filepath, data)
  return filepath
}

export async function readFile(
  category: string,
  filename: string
): Promise<Buffer> {
  const filepath = path.join(STORAGE_DIR, category, filename)
  return fs.readFile(filepath)
}

export async function deleteFile(
  category: string,
  filename: string
): Promise<void> {
  const filepath = path.join(STORAGE_DIR, category, filename)
  try {
    await fs.unlink(filepath)
  } catch {}
}

export async function fileExists(
  category: string,
  filename: string
): Promise<boolean> {
  const filepath = path.join(STORAGE_DIR, category, filename)
  try {
    await fs.access(filepath)
    return true
  } catch {
    return false
  }
}

export async function listFiles(category: string): Promise<string[]> {
  const dir = path.join(STORAGE_DIR, category)
  await ensureDir(dir)
  return fs.readdir(dir)
}

export function getFilePath(category: string, filename: string): string {
  return path.join(STORAGE_DIR, category, filename)
}

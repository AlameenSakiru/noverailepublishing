import path from "path";
import fs from "fs/promises";

const STORAGE_DRIVER = process.env.STORAGE_DRIVER || "local";
const LOCAL_STORAGE_DIR = path.resolve(process.cwd(), process.env.PRIVATE_STORAGE_PATH || "./storage/private");

export interface StorageAdapter {
  saveMasterFile(bookId: string, filename: string, buffer: Buffer): Promise<string>;
  readMasterFile(filePath: string): Promise<Buffer | null>;
  deleteMasterFile(filePath: string): Promise<boolean>;
}

class LocalStorageAdapter implements StorageAdapter {
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  private async ensureDir(dirPath: string) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch {
      // already exists
    }
  }

  async saveMasterFile(bookId: string, filename: string, buffer: Buffer): Promise<string> {
    const bookDir = path.join(this.baseDir, "books", bookId);
    await this.ensureDir(bookDir);
    
    // Sanitize filename
    const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
    const targetPath = path.join(bookDir, safeFilename);
    
    await fs.writeFile(targetPath, buffer);
    return targetPath;
  }

  async readMasterFile(filePath: string): Promise<Buffer | null> {
    try {
      // Path traversal check
      const resolved = path.resolve(filePath);
      if (!resolved.startsWith(this.baseDir)) {
        throw new Error("ACCESS_DENIED_PATH_TRAVERSAL");
      }
      return await fs.readFile(resolved);
    } catch {
      return null;
    }
  }

  async deleteMasterFile(filePath: string): Promise<boolean> {
    try {
      const resolved = path.resolve(filePath);
      if (!resolved.startsWith(this.baseDir)) return false;
      await fs.unlink(resolved);
      return true;
    } catch {
      return false;
    }
  }
}

export const storage = new LocalStorageAdapter(LOCAL_STORAGE_DIR);

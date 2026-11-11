import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdir, writeFile } from "fs/promises";
import { isAbsolute, join } from "path";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class LocalStorageService {
  private readonly uploadDir: string;

  constructor(config: ConfigService) {
    const configured = config.get<string>("UPLOAD_DIR", "./uploads");
    this.uploadDir = isAbsolute(configured)
      ? configured
      : join(process.cwd(), configured);
  }

  async saveImage(buffer: Buffer, extension: string): Promise<string> {
    await mkdir(this.uploadDir, { recursive: true });
    const filename = `${uuidv4()}${extension}`;
    const absolutePath = join(this.uploadDir, filename);
    await writeFile(absolutePath, buffer);
    return `/uploads/${filename}`;
  }
}

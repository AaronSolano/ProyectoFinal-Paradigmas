import {
  BadRequestException,
  Controller,
  PayloadTooLargeException,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { LocalStorageService } from "../services/local-storage.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

const EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

@ApiTags("upload")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("upload")
export class UploadController {
  constructor(private readonly storage: LocalStorageService) {}

  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: MAX_BYTES },
    }),
  )
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("Archivo requerido.");
    }
    if (file.size > MAX_BYTES) {
      throw new PayloadTooLargeException("La imagen supera 5MB.");
    }
    if (!ALLOWED.has(file.mimetype)) {
      throw new BadRequestException("Tipo MIME no permitido.");
    }

    const url = await this.storage.saveImage(
      file.buffer,
      EXT[file.mimetype] ?? ".bin",
    );
    return { url };
  }
}

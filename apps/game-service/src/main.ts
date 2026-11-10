import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import { NestExpressApplication } from "@nestjs/platform-express";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { isAbsolute, join } from "path";
import { AppModule } from "./app.module";

function resolveUploadDir(config: ConfigService): string {
  const configured = config.get<string>("UPLOAD_DIR", "./uploads");
  return isAbsolute(configured) ? configured : join(process.cwd(), configured);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));
  const config = app.get(ConfigService);

  app.setGlobalPrefix("api", { exclude: ["uploads/(.*)"] });

  const uploadDir = resolveUploadDir(config);
  app.useStaticAssets(uploadDir, { prefix: "/uploads" });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("ProfeLink Game API")
    .setDescription("Cuestionarios V/F, uploads y guard JWT audience")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api-json", app, document);

  const http = app.getHttpAdapter().getInstance();
  http.get("/reference/openapi.json", (_req: unknown, res: { json: (d: unknown) => void }) => {
    res.json(document);
  });

  app.use(
    "/reference",
    apiReference({
      spec: { url: "/reference/openapi.json" },
    }),
  );

  const port = config.get<number>("GAME_PORT", 3002);
  await app.listen(port);
}

bootstrap();

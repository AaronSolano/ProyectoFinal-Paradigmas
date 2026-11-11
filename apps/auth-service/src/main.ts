import "./telemetry";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import { AppModule } from "./app.module";
import { enableBrowserCors } from "./http-cors";
import { resolveListenPort } from "./listen-port";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  enableBrowserCors(app);
  const config = app.get(ConfigService);

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("ProfeLink Auth API")
    .setDescription("Registro, login y emisión de JWT con audiencia para game-service")
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
      spec: {
        url: "/reference/openapi.json",
      },
    }),
  );

  const port = resolveListenPort(process.env.PORT, config.get("AUTH_PORT"), 3001);
  await app.listen(port, "0.0.0.0");
}

bootstrap();

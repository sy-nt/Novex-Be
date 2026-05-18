import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { v7 as uuidv7 } from 'uuid';

export const setupSwagger = (
  app: INestApplication,
  options: {
    path: string;
    title: string;
    description: string;
    version: string;
  },
) => {
  const config = new DocumentBuilder()
    .setTitle(options.title)
    .setDescription(options.description)
    .setVersion(options.version)
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: 'request-id',
      schema: {
        example: uuidv7(),
      },
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`api-docs/${options.path}`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
};

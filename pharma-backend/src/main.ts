import { NestFactory, Reflector } from '@nestjs/core';
import {
    ClassSerializerInterceptor,
    ValidationPipe,
    VersioningType,
} from '@nestjs/common';
import { AppModule } from './app.module';
import {
    EntityNotFoundExceptionFilter,
    QueryFailedErrorExceptionFilter,
} from './common';
import { json } from 'body-parser';
import { CustomLogger } from './logging';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

declare const module: any;

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bufferLogs: true,
    });
    app.useLogger(app.get(CustomLogger));

    /*
     * Important: We should keep this order between version and swagger.
     */
    console.log('Enabling API versioning');
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    console.log('Initializing swagger ui');
    const config = new DocumentBuilder()
        .setTitle('eΚΕΠ')
        .setDescription('eΚΕΠ api documentation')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger-ui', app, document);

    console.log('Registering global validation pipe');
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            enableDebugMessages: true,
        }),
    );

    console.log('Registering global exception filters');
    app.useGlobalFilters(new EntityNotFoundExceptionFilter());
    app.useGlobalFilters(new QueryFailedErrorExceptionFilter());

    console.log('Registering global interceptors');
    app.useGlobalInterceptors(
        new ClassSerializerInterceptor(app.get(Reflector)),
    );

    console.log('Enabling shutdown hooks');
    app.enableShutdownHooks();

    const requestEntityPayloadSize = '3mb';
    console.log('Increasing request entity to ' + requestEntityPayloadSize);
    app.use(json({ limit: requestEntityPayloadSize }));

    await app.listen(3000);

    console.log(`Application is running on: ${await app.getUrl()}`);

    if (module.hot) {
        module.hot.accept();
        module.hot.dispose(() => app.close());
    }
}

bootstrap();

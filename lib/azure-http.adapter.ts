/* eslint-disable @typescript-eslint/ban-types */
import { InvocationContext, HttpRequest } from '@azure/functions';
import { HttpServer, INestApplication } from '@nestjs/common';
import { createHandlerAdapter } from './adapter';
import { AzureHttpRouter } from './router';

let handler: Function;

export class AzureHttpAdapterStatic {
  handle(
    createApp: () => Promise<INestApplication>,
    context: InvocationContext,
    req: HttpRequest
  ) {
    if (handler) {
      return handler(context, req);
    }
    this.createHandler(createApp).then((fn) => fn(context, req));
  }

  private async createHandler(
    createApp: () => Promise<
      Omit<INestApplication, 'startAllMicroservicesAsync' | 'listenAsync'>
    >
  ) {
    const app = await createApp();
    const adapter = app.getHttpAdapter();
    if (this.hasGetTypeMethod(adapter) && adapter.getType() === 'azure-http') {
      return (adapter as any as AzureHttpRouter).handle.bind(adapter);
    }
    const instance = app.getHttpAdapter().getInstance();
    handler = createHandlerAdapter(instance);
    return handler;
  }

  private hasGetTypeMethod(
    adapter: HttpServer<any, any>
  ): adapter is HttpServer & { getType: Function } {
    return !!(adapter as any).getType;
  }
}

export const AzureHttpAdapter = new AzureHttpAdapterStatic();

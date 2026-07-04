import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PubSub } from 'graphql-subscriptions';
import { EventsService } from './events.service';
import { NotificationGateway } from './notification.gateway';

const pubSubProvider = {
  provide: 'PUB_SUB',
  useValue: new PubSub(),
};

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: true,
    }),
  ],
  providers: [pubSubProvider, EventsService, NotificationGateway],
  exports: [pubSubProvider, EventsService, NotificationGateway],
})
export class EventsModule {}

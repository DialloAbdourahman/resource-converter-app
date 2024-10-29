import { EXCHANGES, KEYS, Listener, QUEUES } from "@daconverter/common-libs";
import { ConsumeMessage } from "amqplib";
import { userCreatedHandler } from "./handlers/UserCreatedHandler";
import { userUpdatedHandler } from "./handlers/UserUpdatedHandler";
import { videoConvertedHandler } from "./handlers/VideoConvertedHandler";
import { videoNotConvertedHandler } from "./handlers/VideoNotConvertedHandler";

export class ResourceServiceListener extends Listener {
  keys: KEYS[] = [
    KEYS.USER_CREATED,
    KEYS.USER_UPDATED,
    KEYS.VIDEO_CONVERTED,
    KEYS.VIDEO_NOT_CONVERTED,
  ];
  exchange: EXCHANGES = EXCHANGES.CONVERTER_EXCHANGE;
  queue: QUEUES = QUEUES.RESOURCE_QUEUE;

  async handleEvents(key: KEYS, data: any, msg: ConsumeMessage) {
    switch (key) {
      case KEYS.USER_CREATED:
        await userCreatedHandler(data, msg, this.channel);
        break;
      case KEYS.USER_UPDATED:
        await userUpdatedHandler(data, msg, this.channel);
        break;
      case KEYS.VIDEO_CONVERTED:
        await videoConvertedHandler(data, msg, this.channel);
        break;
      case KEYS.VIDEO_NOT_CONVERTED:
        await videoNotConvertedHandler(data, msg, this.channel);
        break;
      default:
        this.channel.nack(msg, false, false);
        break;
    }
  }
}

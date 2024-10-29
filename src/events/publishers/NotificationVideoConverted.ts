import {
  EXCHANGES,
  KEYS,
  Publisher,
  NotificationVideoConvertedEvent,
} from "@daconverter/common-libs";

export class NotificationVideoConvertedPublisher extends Publisher<NotificationVideoConvertedEvent> {
  key: KEYS.NOTIFICATION_VIDEO_CONVERTED = KEYS.NOTIFICATION_VIDEO_CONVERTED;
  exchange: EXCHANGES = EXCHANGES.CONVERTER_EXCHANGE;
}

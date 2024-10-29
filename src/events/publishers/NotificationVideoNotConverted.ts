import {
  EXCHANGES,
  KEYS,
  Publisher,
  NotificationVideoNotConvertedEvent,
} from "@daconverter/common-libs";

export class NotificationVideoNotConvertedPublisher extends Publisher<NotificationVideoNotConvertedEvent> {
  key: KEYS.NOTIFICATION_VIDEO_NOT_CONVERTED =
    KEYS.NOTIFICATION_VIDEO_NOT_CONVERTED;
  exchange: EXCHANGES = EXCHANGES.CONVERTER_EXCHANGE;
}

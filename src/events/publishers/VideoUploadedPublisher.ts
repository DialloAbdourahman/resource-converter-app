import {
  EXCHANGES,
  KEYS,
  Publisher,
  VideoUploadedEvent,
} from "@daconverter/common-libs";

export class VideoUploadedPublisher extends Publisher<VideoUploadedEvent> {
  key: KEYS.VIDEO_UPLOADED = KEYS.VIDEO_UPLOADED;
  exchange: EXCHANGES = EXCHANGES.CONVERTER_EXCHANGE;
}

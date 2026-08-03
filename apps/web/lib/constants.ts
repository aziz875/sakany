import { ROOM_TYPE_LABELS, RoomType } from '@sakany/shared';

export const ROOM_TYPE_OPTIONS = Object.entries(ROOM_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as RoomType, label }),
);

import type { ScheduleMediaResponse } from '../types/api-types';

const MOCK_SCHEDULE_BY_DEVICE: Record<string, ScheduleMediaResponse> = {
  'stb-176': {
    device_id: 'stb-176',
    projects: [
      {
        id: 1,
        name: '信義店全日檔',
        layout_id: 10,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        start_time: '09:00:00',
        end_time: '21:00:00',
        day_of_weeks: '1,2,3,4,5,6,7',
        is_interrupt: false,
      },
    ],
    media: [
      {
        id: 201,
        name: '台北信義店 歡迎影片',
        type: 'video',
        duration_sec: 20,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        file_name: 'xinyi_welcome.mp4',
      },
      {
        id: 202,
        name: '品牌 LOGO 靜態圖',
        type: 'image',
        duration_sec: 8,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        file_name: 'brand_logo.png',
      },
    ],
    time_table: [
      { project_id: 1, media_id: 201, sequence: 1 },
      { project_id: 1, media_id: 202, sequence: 2 },
    ],
    today_schedule: {
      date: '2026-09-15',
      project_ids: [1],
    },
    mock: true,
  },
  'stb-148': {
    device_id: 'stb-148',
    projects: [
      {
        id: 1,
        name: '主檔全日播放',
        layout_id: 20,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        start_time: '08:00:00',
        end_time: '22:00:00',
        day_of_weeks: '1,2,3,4,5,6,7',
        is_interrupt: false,
      },
      {
        id: 2,
        name: '午間套餐插播',
        layout_id: 21,
        start_date: '2026-09-01',
        end_date: '2026-09-30',
        start_time: '12:00:00',
        end_time: '13:00:00',
        day_of_weeks: '1,2,3,4,5',
        is_interrupt: true,
      },
      {
        id: 3,
        name: '晚間活動檔',
        layout_id: 22,
        start_date: '2026-09-15',
        end_date: '2026-09-15',
        start_time: '18:00:00',
        end_time: '20:00:00',
        day_of_weeks: '1',
        is_interrupt: true,
      },
    ],
    media: [
      {
        id: 301,
        name: '多專案排程 主影片',
        type: 'video',
        duration_sec: 30,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        file_name: 'main_loop.mp4',
      },
      {
        id: 302,
        name: '午間套餐圖',
        type: 'image',
        duration_sec: 12,
        start_date: '2026-09-01',
        end_date: '2026-09-30',
        file_name: 'lunch_set.jpg',
      },
      {
        id: 303,
        name: '晚間活動倒數',
        type: 'web',
        duration_sec: 15,
        start_date: '2026-09-15',
        end_date: '2026-09-15',
        file_name: 'https://promo.example.com/countdown',
      },
    ],
    time_table: [
      { project_id: 1, media_id: 301, sequence: 1 },
      { project_id: 2, media_id: 302, sequence: 1 },
      { project_id: 3, media_id: 303, sequence: 1 },
    ],
    today_schedule: {
      date: '2026-09-15',
      project_ids: [1, 2, 3],
    },
    mock: true,
  },
};

export function getMockScheduleMedia(deviceId: string): ScheduleMediaResponse {
  const matched = MOCK_SCHEDULE_BY_DEVICE[deviceId];
  if (matched) {
    return matched;
  }

  return {
    device_id: deviceId,
    projects: [
      {
        id: 1,
        name: '展示專案',
        layout_id: 1,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        start_time: '08:00:00',
        end_time: '22:00:00',
        day_of_weeks: '1,2,3,4,5,6,7',
        is_interrupt: false,
      },
    ],
    media: [
      {
        id: 1,
        name: '展示素材 A',
        type: 'image',
        duration_sec: 10,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        file_name: 'demo_asset.jpg',
      },
    ],
    time_table: [{ project_id: 1, media_id: 1, sequence: 1 }],
    today_schedule: {
      date: '2026-09-15',
      project_ids: [1],
    },
    mock: true,
  };
}

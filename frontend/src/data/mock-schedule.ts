import type { ScheduleMediaResponse } from '../types/api-types';

const MOCK_SCHEDULE_BY_DEVICE: Record<string, ScheduleMediaResponse> = {
  'stb-176': {
    device_id: 'stb-176',
    projects: [
      {
        id: 1,
        layout_id: 10,
        layout_name: 'Basic 1920x1080 16:9',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        start_time: '09:00:00',
        end_time: '21:00:00',
        day_of_weeks: '1,2,3,4,5,6,7',
        is_interrupt: false,
        media_ids: [201, 202],
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
        id: 166,
        layout_id: 20,
        layout_name: 'Basic 1920x1080 16:9',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        start_time: '14:00:00',
        end_time: '18:30:00',
        day_of_weeks: '1,2,3,4,5,6,7',
        is_interrupt: false,
        media_ids: [2415, 2414, 2413],
      },
      {
        id: 210,
        layout_id: 21,
        layout_name: 'Basic 1920x1080 16:9',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        start_time: '18:31:00',
        end_time: '23:59:00',
        day_of_weeks: '1,2,3,4,5,6,7',
        is_interrupt: false,
        media_ids: [2418, 2417],
      },
      {
        id: 3,
        layout_id: 22,
        layout_name: 'Basic 1920x1080 16:9',
        start_date: '2026-09-15',
        end_date: '2026-09-15',
        start_time: '12:00:00',
        end_time: '13:00:00',
        day_of_weeks: '1',
        is_interrupt: true,
        media_ids: [302],
      },
    ],
    media: [
      {
        id: 2415,
        name: '多專案排程 主影片 A',
        type: 'video',
        duration_sec: 30,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        file_name: 'main_loop_a.mp4',
      },
      {
        id: 2414,
        name: '多專案排程 主影片 B',
        type: 'video',
        duration_sec: 25,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        file_name: 'main_loop_b.mp4',
      },
      {
        id: 2413,
        name: '品牌 LOGO 靜態圖',
        type: 'image',
        duration_sec: 8,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        file_name: 'brand_logo.png',
      },
      {
        id: 2418,
        name: '晚間活動倒數',
        type: 'web',
        duration_sec: 15,
        start_date: '2026-09-15',
        end_date: '2026-09-15',
        file_name: 'https://promo.example.com/countdown',
      },
      {
        id: 2417,
        name: '晚間套餐圖',
        type: 'image',
        duration_sec: 12,
        start_date: '2026-09-01',
        end_date: '2026-09-30',
        file_name: 'evening_set.jpg',
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
    ],
    time_table: [
      { project_id: 166, media_id: 2415, sequence: 1 },
      { project_id: 166, media_id: 2414, sequence: 2 },
      { project_id: 166, media_id: 2413, sequence: 3 },
      { project_id: 210, media_id: 2418, sequence: 1 },
      { project_id: 210, media_id: 2417, sequence: 2 },
      { project_id: 3, media_id: 302, sequence: 1 },
    ],
    today_schedule: {
      date: '2026-09-15',
      project_ids: [166, 210, 3],
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
        layout_id: 1,
        layout_name: 'Basic 1920x1080 16:9',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        start_time: '08:00:00',
        end_time: '22:00:00',
        day_of_weeks: '1,2,3,4,5,6,7',
        is_interrupt: false,
        media_ids: [1],
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

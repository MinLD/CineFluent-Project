# Admin Dashboard - Step By Step (Database -> Backend -> Frontend)

Mục tiêu của tài liệu này là giúp bạn tự code trang `Dashboard Admin` theo đúng kiến trúc CineFluent hiện tại:

- Backend: `Flask + SQLAlchemy + controller/service`
- Frontend: `Next.js app router`
- Ưu tiên: `Server Action + TanStack Query`

---

## 0) Scope MVP cần làm trước

Dashboard bản đầu tiên chỉ cần 5 khối:

1. Summary cards
2. User growth chart (7 hoặc 30 ngày)
3. Alert panel
4. Top videos
5. Recent activities

Không cần thêm nhiều module mới ở phase này.

---

## 1) Database

### 1.1. Dữ liệu đã có sẵn (không cần tạo bảng mới cho MVP)

Bạn đã có đủ bảng để làm dashboard:

- `users`, `user_profile`
- `videos`, `subtitles`
- `movie_requests`, `video_reports`
- `watch_history`
- `movie_ai_analyses`

Vì vậy MVP có thể chạy ngay trên dữ liệu cũ.

### 1.2. Tạo migration index để query nhanh hơn

Tạo migration mới:

```bash
cd server/be_flask_cinefluent
flask db migrate -m "add indexes for admin dashboard queries"
```

Sửa file migration vừa tạo theo mẫu:

```python
from alembic import op
import sqlalchemy as sa


revision = "xxxxxxxxxxxx"
down_revision = "6f4c1b2d9a10"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index("ix_users_created_at", "users", ["created_at"], unique=False)
    op.create_index("ix_user_profile_is_online", "user_profile", ["is_online"], unique=False)
    op.create_index(
        "ix_movie_requests_status_created_at",
        "movie_requests",
        ["status", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_video_reports_status_created_at",
        "video_reports",
        ["status", "created_at"],
        unique=False,
    )
    op.create_index("ix_watch_history_watched_at", "watch_history", ["watched_at"], unique=False)


def downgrade():
    op.drop_index("ix_watch_history_watched_at", table_name="watch_history")
    op.drop_index("ix_video_reports_status_created_at", table_name="video_reports")
    op.drop_index("ix_movie_requests_status_created_at", table_name="movie_requests")
    op.drop_index("ix_user_profile_is_online", table_name="user_profile")
    op.drop_index("ix_users_created_at", table_name="users")
```

Chạy migrate:

```bash
flask db upgrade
```

---

## 2) Backend

### 2.1. Tạo service tổng hợp dữ liệu dashboard

Tạo file mới:

`server/be_flask_cinefluent/app/services/admin_dashboard_service.py`

```python
from datetime import datetime, timedelta
from sqlalchemy import func, desc

from ..extensions import db
from ..models.models_model import (
    User,
    UserProfile,
    Video,
    Subtitle,
    MovieRequest,
    VideoReport,
    WatchHistory,
    MovieAIAnalysis,
)


def _build_daily_series(days: int):
    today = datetime.utcnow().date()
    return [(today - timedelta(days=offset)) for offset in range(days - 1, -1, -1)]


def get_admin_dashboard_overview(days: int = 7, top: int = 5):
    days = max(3, min(days, 90))
    top = max(3, min(top, 20))

    # Summary
    total_users = db.session.query(func.count(User.id)).scalar() or 0
    active_users = (
        db.session.query(func.count(UserProfile.id))
        .filter(UserProfile.is_online.is_(True))
        .scalar()
        or 0
    )
    total_videos = db.session.query(func.count(Video.id)).scalar() or 0
    public_videos = (
        db.session.query(func.count(Video.id))
        .filter(Video.status == "public")
        .scalar()
        or 0
    )
    pending_requests = (
        db.session.query(func.count(MovieRequest.id))
        .filter(MovieRequest.status == "PENDING")
        .scalar()
        or 0
    )
    pending_reports = (
        db.session.query(func.count(VideoReport.id))
        .filter(VideoReport.status == "PENDING")
        .scalar()
        or 0
    )

    # Content status
    videos_with_ai = db.session.query(func.count(MovieAIAnalysis.id)).scalar() or 0
    videos_with_subtitle = (
        db.session.query(func.count(func.distinct(Subtitle.video_id))).scalar() or 0
    )
    videos_without_ai = max(0, total_videos - videos_with_ai)
    videos_without_subtitle = max(0, total_videos - videos_with_subtitle)

    # User growth
    series_days = _build_daily_series(days)
    start_date = series_days[0]

    new_user_rows = (
        db.session.query(func.date(User.created_at), func.count(User.id))
        .filter(func.date(User.created_at) >= start_date)
        .group_by(func.date(User.created_at))
        .all()
    )
    new_user_map = {str(day): count for day, count in new_user_rows}

    active_rows = (
        db.session.query(func.date(WatchHistory.watched_at), func.count(func.distinct(WatchHistory.user_id)))
        .filter(func.date(WatchHistory.watched_at) >= start_date)
        .group_by(func.date(WatchHistory.watched_at))
        .all()
    )
    active_map = {str(day): count for day, count in active_rows}

    growth_dates = [d.isoformat() for d in series_days]
    growth_new_users = [new_user_map.get(d.isoformat(), 0) for d in series_days]
    growth_active_users = [active_map.get(d.isoformat(), 0) for d in series_days]

    # Top videos
    top_rows = (
        db.session.query(
            Video.id,
            Video.title,
            Video.slug,
            Video.view_count,
            Video.status,
            Video.level,
            MovieAIAnalysis.movie_cefr_range,
            func.count(Subtitle.id).label("subtitle_count"),
        )
        .outerjoin(Subtitle, Subtitle.video_id == Video.id)
        .outerjoin(MovieAIAnalysis, MovieAIAnalysis.video_id == Video.id)
        .group_by(
            Video.id,
            Video.title,
            Video.slug,
            Video.view_count,
            Video.status,
            Video.level,
            MovieAIAnalysis.movie_cefr_range,
        )
        .order_by(desc(Video.view_count), desc(Video.id))
        .limit(top)
        .all()
    )
    top_videos = [
        {
            "id": row.id,
            "title": row.title,
            "slug": row.slug,
            "view_count": row.view_count or 0,
            "status": row.status,
            "level": row.level,
            "cefr": row.movie_cefr_range,
            "subtitle_count": row.subtitle_count or 0,
        }
        for row in top_rows
    ]

    # Alerts
    alerts = []
    if pending_reports > 0:
        alerts.append(
            {
                "key": "pending_reports",
                "level": "critical",
                "title": "Có báo lỗi video chưa xử lý",
                "value": pending_reports,
            }
        )
    if pending_requests > 0:
        alerts.append(
            {
                "key": "pending_requests",
                "level": "warning",
                "title": "Có yêu cầu phim chờ xử lý",
                "value": pending_requests,
            }
        )
    if videos_without_subtitle > 0:
        alerts.append(
            {
                "key": "videos_without_subtitle",
                "level": "warning",
                "title": "Có phim chưa có subtitle",
                "value": videos_without_subtitle,
            }
        )
    if videos_without_ai > 0:
        alerts.append(
            {
                "key": "videos_without_ai",
                "level": "info",
                "title": "Có phim chưa phân tích độ khó AI",
                "value": videos_without_ai,
            }
        )

    # Recent activities (ghép từ users/requests/reports)
    recent_users = (
        db.session.query(User.id, User.email, User.created_at)
        .order_by(desc(User.created_at))
        .limit(5)
        .all()
    )
    recent_requests = (
        db.session.query(MovieRequest.id, MovieRequest.title, MovieRequest.created_at)
        .order_by(desc(MovieRequest.created_at))
        .limit(5)
        .all()
    )
    recent_reports = (
        db.session.query(VideoReport.id, VideoReport.issue_type, VideoReport.created_at)
        .order_by(desc(VideoReport.created_at))
        .limit(5)
        .all()
    )

    activities = []
    for row in recent_users:
        activities.append(
            {
                "type": "user_registered",
                "label": f"User mới: {row.email}",
                "created_at": row.created_at.isoformat(),
            }
        )
    for row in recent_requests:
        activities.append(
            {
                "type": "movie_request",
                "label": f"Yêu cầu phim: {row.title}",
                "created_at": row.created_at.isoformat(),
            }
        )
    for row in recent_reports:
        activities.append(
            {
                "type": "video_report",
                "label": f"Báo lỗi: {row.issue_type}",
                "created_at": row.created_at.isoformat(),
            }
        )

    activities = sorted(activities, key=lambda x: x["created_at"], reverse=True)[:10]

    return {
        "summary": {
            "total_users": total_users,
            "active_users": active_users,
            "total_videos": total_videos,
            "public_videos": public_videos,
            "pending_requests": pending_requests,
            "pending_reports": pending_reports,
        },
        "charts": {
            "user_growth": {
                "dates": growth_dates,
                "new_users": growth_new_users,
                "active_users": growth_active_users,
            },
            "content_status": {
                "videos_with_ai": videos_with_ai,
                "videos_without_ai": videos_without_ai,
                "videos_with_subtitle": videos_with_subtitle,
                "videos_without_subtitle": videos_without_subtitle,
            },
        },
        "top_videos": top_videos,
        "alerts": alerts,
        "recent_activities": activities,
    }
```

### 2.2. Tạo controller cho dashboard

Tạo file:

`server/be_flask_cinefluent/app/controller/admin_dashboard_controller.py`

```python
from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from ..utils.response import success_response
from ..controller.auth_controller import Role_required
from ..services.admin_dashboard_service import get_admin_dashboard_overview

admin_dashboard_bp = Blueprint("api/admin-dashboard", __name__)


@admin_dashboard_bp.route("/overview", methods=["GET"])
@Role_required(role="admin")
@jwt_required()
def get_dashboard_overview():
    days = request.args.get("days", default=7, type=int)
    top = request.args.get("top", default=5, type=int)
    data = get_admin_dashboard_overview(days=days, top=top)
    return success_response(data=data, message="Get dashboard overview successfully", code=200)
```

### 2.3. Register blueprint

Sửa file:

`server/be_flask_cinefluent/app/__init__.py`

Thêm:

```python
from .controller.admin_dashboard_controller import admin_dashboard_bp
app.register_blueprint(admin_dashboard_bp, url_prefix='/api/admin-dashboard')
```

### 2.4. (Quan trọng) Fix endpoint cũ `/users/stats`

Frontend hiện đang gọi `/users/stats` nhưng backend chưa có route tương ứng.

Bạn có 2 cách:

1. Giữ route cũ để tương thích:
   - Tạo `/users/stats` và trả về dữ liệu cũ.
2. Chuyển hẳn dashboard sang `/admin-dashboard/overview`:
   - Cách này sạch hơn và nên dùng cho phase mới.

---

## 3) Frontend (ưu tiên Server Action + TanStack Query)

## 3.1. Tạo type cho dashboard

Tạo file:

`client/Fe_CineFluent/app/lib/types/admin_dashboard.ts`

```ts
export interface IDashboardSummary {
  total_users: number;
  active_users: number;
  total_videos: number;
  public_videos: number;
  pending_requests: number;
  pending_reports: number;
}

export interface IDashboardUserGrowth {
  dates: string[];
  new_users: number[];
  active_users: number[];
}

export interface IDashboardContentStatus {
  videos_with_ai: number;
  videos_without_ai: number;
  videos_with_subtitle: number;
  videos_without_subtitle: number;
}

export interface IDashboardTopVideo {
  id: number;
  title: string;
  slug: string;
  view_count: number;
  status: string;
  level: string;
  cefr?: string | null;
  subtitle_count: number;
}

export interface IDashboardAlert {
  key: string;
  level: "critical" | "warning" | "info";
  title: string;
  value: number;
}

export interface IDashboardActivity {
  type: string;
  label: string;
  created_at: string;
}

export interface IAdminDashboardOverview {
  summary: IDashboardSummary;
  charts: {
    user_growth: IDashboardUserGrowth;
    content_status: IDashboardContentStatus;
  };
  top_videos: IDashboardTopVideo[];
  alerts: IDashboardAlert[];
  recent_activities: IDashboardActivity[];
}
```

### 3.2. Tạo service call backend

Tạo file:

`client/Fe_CineFluent/app/lib/services/admin_dashboard.ts`

```ts
import { axiosClient } from "@/app/lib/services/api_client";

export const Api_Admin_Dashboard_Overview = (
  token?: string,
  days = 7,
  top = 5,
) => {
  return axiosClient.get("/admin-dashboard/overview", {
    params: { days, top },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
```

### 3.3. Tạo server data loader (SSR initial data)

Tạo file:

`client/Fe_CineFluent/app/lib/data/admin_dashboard.ts`

```ts
import { cookies } from "next/headers";
import { Api_Admin_Dashboard_Overview } from "@/app/lib/services/admin_dashboard";
import { IAdminDashboardOverview } from "@/app/lib/types/admin_dashboard";

function emptyDashboard(): IAdminDashboardOverview {
  return {
    summary: {
      total_users: 0,
      active_users: 0,
      total_videos: 0,
      public_videos: 0,
      pending_requests: 0,
      pending_reports: 0,
    },
    charts: {
      user_growth: { dates: [], new_users: [], active_users: [] },
      content_status: {
        videos_with_ai: 0,
        videos_without_ai: 0,
        videos_with_subtitle: 0,
        videos_without_subtitle: 0,
      },
    },
    top_videos: [],
    alerts: [],
    recent_activities: [],
  };
}

export async function SSR_Admin_Dashboard(days = 7, top = 5) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res = await Api_Admin_Dashboard_Overview(token, days, top);
    return res?.data?.data ?? emptyDashboard();
  } catch (error) {
    return emptyDashboard();
  }
}
```

### 3.4. Tạo server action để TanStack Query gọi

Tạo file:

`client/Fe_CineFluent/app/lib/actions/admin_dashboard.ts`

```ts
"use server";

import { cookies } from "next/headers";
import { Api_Admin_Dashboard_Overview } from "@/app/lib/services/admin_dashboard";
import { IAdminDashboardOverview } from "@/app/lib/types/admin_dashboard";

function emptyDashboard(): IAdminDashboardOverview {
  return {
    summary: {
      total_users: 0,
      active_users: 0,
      total_videos: 0,
      public_videos: 0,
      pending_requests: 0,
      pending_reports: 0,
    },
    charts: {
      user_growth: { dates: [], new_users: [], active_users: [] },
      content_status: {
        videos_with_ai: 0,
        videos_without_ai: 0,
        videos_with_subtitle: 0,
        videos_without_subtitle: 0,
      },
    },
    top_videos: [],
    alerts: [],
    recent_activities: [],
  };
}

export async function getAdminDashboardAction(days = 7, top = 5) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res = await Api_Admin_Dashboard_Overview(token, days, top);
    return res?.data?.data ?? emptyDashboard();
  } catch (error) {
    return emptyDashboard();
  }
}
```

### 3.5. Sửa wrapper dashboard để truyền initial data

Sửa file:

`client/Fe_CineFluent/app/components/admin/wrappers/DashBoardSection.tsx`

```tsx
import DashboardPage from "@/app/components/admin/dash_board_page";
import { SSR_Admin_Dashboard } from "@/app/lib/data/admin_dashboard";

const DashBoardSection = async () => {
  const initialData = await SSR_Admin_Dashboard(7, 5);
  return <DashboardPage initialData={initialData} />;
};

export default DashBoardSection;
```

### 3.6. Sửa dashboard page sang client mode + TanStack Query

Sửa file:

`client/Fe_CineFluent/app/components/admin/dash_board_page/index.tsx`

```tsx
"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Activity, Film, Globe, MessageCircleWarning, TriangleAlert } from "lucide-react";

import StatCard from "@/app/components/stat_card";
import { getAdminDashboardAction } from "@/app/lib/actions/admin_dashboard";
import { IAdminDashboardOverview } from "@/app/lib/types/admin_dashboard";

type Props = {
  initialData: IAdminDashboardOverview;
};

export default function DashboardPage({ initialData }: Props) {
  const [days, setDays] = useState(7);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-dashboard-overview", days],
    queryFn: () => getAdminDashboardAction(days, 5),
    initialData,
    staleTime: 60 * 1000,
  });

  const growthData = useMemo(() => {
    const growth = data?.charts?.user_growth;
    if (!growth) return [];
    return growth.dates.map((d, idx) => ({
      date: d,
      new_users: growth.new_users[idx] ?? 0,
      active_users: growth.active_users[idx] ?? 0,
    }));
  }, [data]);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Tổng quan hệ thống</h1>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value={7}>7 ngày</option>
            <option value={30}>30 ngày</option>
          </select>
          <button
            onClick={() => refetch()}
            className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Làm mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Tổng người dùng" value={data.summary.total_users} icon={Users} />
        <StatCard title="Người dùng hoạt động" value={data.summary.active_users} icon={Activity} />
        <StatCard title="Tổng phim" value={data.summary.total_videos} icon={Film} />
        <StatCard title="Phim public" value={data.summary.public_videos} icon={Globe} />
        <StatCard title="Yêu cầu chờ xử lý" value={data.summary.pending_requests} icon={MessageCircleWarning} />
        <StatCard title="Báo lỗi chờ xử lý" value={data.summary.pending_reports} icon={TriangleAlert} />
      </div>

      {/* Bạn tách tiếp ra component chart, alert panel, top video, recent activity */}
      <div className="bg-white rounded-xl border p-4">
        <p className="font-semibold mb-3">User growth data</p>
        <pre className="text-xs overflow-auto">{JSON.stringify(growthData, null, 2)}</pre>
      </div>
    </div>
  );
}
```

Sau khi chạy ổn, bạn thay block `<pre>` bằng chart thật (`recharts`) để đẹp hơn.

### 3.7. Khuyến nghị tách component để dễ quản lý

Bạn nên tách thêm:

- `DashboardHeader.tsx`
- `SummaryCards.tsx`
- `UserGrowthChart.tsx`
- `AlertPanel.tsx`
- `TopVideosTable.tsx`
- `RecentActivitiesList.tsx`

Cách này giữ cho `index.tsx` ngắn, dễ bảo trì.

---

## 4) Test checklist

### 4.1. Backend

1. Login bằng tài khoản admin
2. Gọi:
   - `GET /api/admin-dashboard/overview?days=7&top=5`
3. Verify trả về đủ keys:
   - `summary`
   - `charts`
   - `top_videos`
   - `alerts`
   - `recent_activities`

### 4.2. Frontend

1. Vào tab `Dashboard`
2. Có render đủ summary cards
3. Đổi `7 ngày` sang `30 ngày` thì query chạy lại
4. Nút `Làm mới` hoạt động
5. Không bị crash nếu API lỗi hoặc trả rỗng

---

## 5) Gợi ý mở rộng ngay sau MVP

1. Thêm API `GET /api/admin-dashboard/alerts` riêng nếu muốn polling nhanh.
2. Thêm realtime dashboard bằng socket:
   - có request/report mới -> push event -> dashboard tự cập nhật.
3. Thêm chart phân bố CEFR trong `movie_ai_analyses`.
4. Thêm quick action buttons để đi thẳng tới:
   - quản lý phim
   - quản lý người dùng
   - request/report.

---

## 6) Lưu ý tương thích với code cũ

Hiện tại dashboard cũ đang gọi `/users/stats` và kỳ vọng response shape khác (`data.result.data`).  
Khi chuyển sang `admin-dashboard/overview`, bạn nên thay toàn bộ luồng cũ để tránh mismatch response.

Nếu muốn giữ backward compatibility tạm thời, hãy:

- để `/users/stats` cũ chạy cho phần cũ,
- dashboard mới chỉ dùng `/admin-dashboard/overview`.

Như vậy migration sẽ an toàn hơn và dễ rollback.

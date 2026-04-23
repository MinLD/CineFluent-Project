import { Video } from "lucide-react";

import ClassRecordingControls from "@/app/components/classrooms/ClassRecordingControls";
import { IClassroom, IClassSession } from "@/app/lib/types/classroom";

function buildJitsiRoomName(classroomId: number, sessionId: number) {
  return `cinefluent-class-${classroomId}-session-${sessionId}`;
}

function buildJitsiUrl(classroomId: number, sessionId: number) {
  const roomName = buildJitsiRoomName(classroomId, sessionId);
  const params = [
    "config.prejoinPageEnabled=true",
    "config.disableDeepLinking=true",
    "interfaceConfig.SHOW_JITSI_WATERMARK=false",
  ].join("&");

  return `https://meet.jit.si/${roomName}#${params}`;
}

export default function LiveClassroomRoom({
  classroom,
  session,
}: {
  classroom: IClassroom;
  session: IClassSession;
}) {
  const meetingUrl = buildJitsiUrl(classroom.id, session.id);
  const isTeacher = classroom.my_role === "teacher";

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-h-[620px] overflow-hidden rounded-[28px] border border-slate-800 bg-black shadow-2xl">
            <iframe
              src={meetingUrl}
              title={`Phòng học ${session.title}`}
              allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
              className="h-full min-h-[620px] w-full border-0"
            />
          </div>

          <aside className="space-y-4 rounded-[28px] border border-slate-800 bg-slate-900 p-5 text-white shadow-sm">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <Video className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-xl font-black">Thông tin buổi học</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Đây là phòng live của buổi học. Giáo viên dạy trực tiếp, học viên
                vào cùng link để học, xem recap và làm bài tập ngay trong lớp.
              </p>
            </div>

            {isTeacher ? (
              <ClassRecordingControls
                classroomId={classroom.id}
                sessionId={session.id}
                initialRecap={session.recap}
              />
            ) : session.recap ? (
              <ClassRecordingControls
                classroomId={classroom.id}
                sessionId={session.id}
                initialRecap={session.recap}
                readOnly
              />
            ) : null}

            <div className="space-y-4 text-sm">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="font-semibold text-slate-400">Trạng thái</p>
                <p className="mt-1 font-bold text-white">
                  {session.status === "PLANNED" ? "Đã lên lịch" : session.status}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="font-semibold text-slate-400">Trọng tâm ngữ pháp</p>
                {session.grammar_focus?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {session.grammar_focus.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-blue-900 bg-blue-950 px-3 py-1 text-xs font-semibold text-blue-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-slate-500">Chưa chọn trọng tâm.</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="font-semibold text-slate-400">Ghi chú</p>
                <p className="mt-1 leading-relaxed text-slate-300">
                  {session.teacher_notes ||
                    session.description ||
                    "Chưa có ghi chú cho buổi học này."}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

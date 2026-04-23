import Link from "next/link";
import { BookOpenCheck, Compass, Lock, Sparkles, Target } from "lucide-react";

import { SSR_LearningTreeData } from "@/app/lib/data/learning_tree";
import {
  ILearningTreeBranch,
  ILearningTreePageData,
  ILearningTreeTagNode,
} from "@/app/lib/types/learning_tree";

function getNodeStyle(node: ILearningTreeTagNode) {
  if (node.state === "mastered") {
    return {
      shell: "border-emerald-300 bg-emerald-50",
      inner: "bg-emerald-600 text-white",
      badge: "Đã vững",
      badgeClass: "bg-emerald-100 text-emerald-700",
    };
  }

  if (node.review_priority >= 40) {
    return {
      shell: "border-amber-300 bg-amber-50",
      inner: "bg-amber-500 text-white",
      badge: "Cần ôn",
      badgeClass: "bg-amber-100 text-amber-700",
    };
  }

  return {
    shell: "border-sky-300 bg-sky-50",
    inner: "bg-sky-500 text-white",
    badge: "Đang học",
    badgeClass: "bg-sky-100 text-sky-700",
  };
}

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Compass;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function GrammarNode({ node }: { node: ILearningTreeTagNode }) {
  const style = getNodeStyle(node);
  const sourceText = node.source_label ? node.source_label.toLowerCase() : "hệ thống";

  return (
    <div className="flex min-w-[220px] flex-col items-center gap-4">
      <div className={`rounded-[24px] border p-2 ${style.shell}`}>
        <div
          className={`flex h-[96px] w-[96px] rotate-45 items-center justify-center rounded-[20px] ${style.inner}`}
        >
          <div className="-rotate-45 px-2 text-center">
            <p className="text-sm font-bold leading-tight">{node.label_vi}</p>
            <p className="mt-1 text-xs font-semibold">{Math.round(node.mastery_score)}%</p>
          </div>
        </div>
      </div>

      <div className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center shadow-sm">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${style.badgeClass}`}
        >
          {style.badge}
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-900">{node.label_en}</p>
        <p className="mt-1 text-xs text-slate-500">
          Gặp {node.encounter_count} lần qua {sourceText}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={`/studies/grammar/${node.tag_id}/lesson`}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Học lý thuyết
          </Link>
          <Link
            href={`/studies/grammar/${node.tag_id}/review`}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            Ôn tập
          </Link>
        </div>
      </div>
    </div>
  );
}

function LockedNode() {
  return (
    <div className="flex min-w-[120px] flex-col items-center gap-4">
      <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-2">
        <div className="flex h-[76px] w-[76px] rotate-45 items-center justify-center rounded-[18px] bg-slate-100">
          <Lock className="h-4 w-4 -rotate-45 text-slate-400" />
        </div>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        Chưa mở
      </p>
    </div>
  );
}

function BranchRow({ branch }: { branch: ILearningTreeBranch }) {
  const lockedNodes = Math.min(branch.locked_count, 2);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-600">
            Nhánh
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">{branch.name_vi}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {branch.description || "Các điểm ngữ pháp bạn đã mở trong nhánh này."}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Đã mở
              </p>
              <p className="mt-1 text-xl font-black text-slate-900">
                {branch.discovered_count}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Đã vững
              </p>
              <p className="mt-1 text-xl font-black text-slate-900">
                {branch.mastered_count}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-6">
          <div className="flex flex-wrap items-start gap-6">
            {branch.tags.map((node) => (
              <GrammarNode key={node.tag_id} node={node} />
            ))}
            {Array.from({ length: lockedNodes }).map((_, index) => (
              <LockedNode key={`${branch.branch_id}-locked-${index}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function UnauthorizedState() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
          <BookOpenCheck className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Vui lòng đăng nhập</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-500">
          Bạn cần đăng nhập để xem tiến trình học tập và cây khám phá ngữ pháp của riêng mình.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <Compass className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Không thể tải dữ liệu</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-500">{message}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
        <Compass className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Bạn chưa mở khóa kiến thức nào</h2>
      <p className="mx-auto mt-3 max-w-2xl text-slate-500">
        Hãy tiếp tục xem phim hoặc làm quiz. Khi gặp điểm ngữ pháp mới, cây sẽ mở thêm
        node tương ứng.
      </p>
      <div className="mt-8">
        <Link
          href="/studies/movies"
          className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
        >
          Tiếp tục khám phá qua phim
        </Link>
      </div>
    </div>
  );
}

function LearningTreePage({ data }: { data: ILearningTreePageData }) {
  const tree = data.tree;
  const summary = data.summary;

  if (!tree || !summary) {
    return <EmptyState />;
  }

  const overview = tree.overview;
  const discoveredRate = overview.total_tags
    ? Math.round((overview.discovered_total / overview.total_tags) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">
                Tiến trình học tập
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">
                Cây khám phá ngữ pháp
              </h1>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Mỗi node là một điểm ngữ pháp bạn đã gặp qua phim hoặc quiz. Từ đây bạn có
                thể học lý thuyết ngay hoặc mở bài ôn tập ngắn để củng cố kiến thức.
              </p>
            </div>

            <Link
              href="/studies/movies"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
            >
              <Compass className="h-4 w-4" />
              Tiếp tục khám phá
            </Link>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <StatItem
              icon={Compass}
              label="Đã khám phá"
              value={`${overview.discovered_total}/${overview.total_tags}`}
            />
            <StatItem
              icon={Sparkles}
              label="Tỷ lệ mở khóa"
              value={`${discoveredRate}%`}
            />
            <StatItem
              icon={Target}
              label="Nhánh đã mở"
              value={`${overview.discovered_branch_count}/${overview.branch_count}`}
            />
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {tree.branches.length === 0 ? (
            <EmptyState />
          ) : (
            tree.branches.map((branch) => (
              <BranchRow key={branch.branch_id} branch={branch} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default async function LearningTreeSection() {
  const { data, error } = await SSR_LearningTreeData();

  if (error === "401") {
    return <UnauthorizedState />;
  }

  if (error && !data) {
    return <ErrorState message={error} />;
  }

  return <LearningTreePage data={data ?? { tree: null, summary: null }} />;
}

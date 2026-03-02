import SoloTypingGame from "@/app/components/game/typing";

export const metadata = {
  title: "Typing Game | CineFluent",
  description:
    "Luyện gõ chữ qua các câu chuyện thú vị và cải nâng cao tốc độ gõ phím của bạn.",
};

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-[#020617] pt-10">
      <SoloTypingGame />
    </div>
  );
}

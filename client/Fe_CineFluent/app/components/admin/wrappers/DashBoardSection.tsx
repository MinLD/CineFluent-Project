import DashboardPage from "@/app/components/admin/dash_board_page";
import { SSR_Users_Stats } from "@/app/lib/data/users";

const DashBoardSection = async () => {
  const { summary, chart_data } = await SSR_Users_Stats();
  console.log("res dash board section:", { summary, chart_data });
  const userStats = { summary, chart_data };
  return (
    <>
      <DashboardPage userStats={userStats} />
    </>
  );
};
export default DashBoardSection;

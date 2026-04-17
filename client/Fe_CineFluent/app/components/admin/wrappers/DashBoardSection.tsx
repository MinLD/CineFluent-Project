import DashboardPage from "@/app/components/admin/dash_board_page";
import { SSR_Admin_Dashboard } from "@/app/lib/data/admin_dashboard";
import { SSR_Users_Stats } from "@/app/lib/data/users";

const DashBoardSection = async () => {
const initialData = await SSR_Admin_Dashboard(7,5 );

  return (
    <>
      <DashboardPage initialData={initialData} />
    </>
  );
};
export default DashBoardSection;

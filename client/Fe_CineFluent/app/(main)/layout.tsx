// app/(main)/layout.tsx

import MyFooter from "@/app/components/footer";
import MyHeader from "@/app/components/header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MyHeader />
      <main>{children}</main>
      <MyFooter />
    </>
  );
}

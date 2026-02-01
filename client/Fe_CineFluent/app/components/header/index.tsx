import HeaderBottom from "@/app/components/header/(layout)/header_bottom";
import HeaderTop from "@/app/components/header/(layout)/header_top";

function MyHeader() {
  return (
    <>
      <div className="sticky top-0 z-20 w-full  shadow-sm">
        <div className="relative z-20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 ">
          <HeaderTop />
        </div>
        <div className="relative z-10 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/80 ">
          <HeaderBottom />
        </div>
      </div>
    </>
  );
}

export default MyHeader;

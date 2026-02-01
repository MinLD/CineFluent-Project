import Logo from "@/app/components/logo";
import { siteTitleFooter } from "@/app/lib/constants/site";
import { Facebook, Heart, Instagram, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";

function MyFooter() {
  return (
    <>
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Logo />
              <p className="text-gray-400 text-sm">
                Kết nối doanh nghiệp và cá nhân để tạo ra sự thay đổi tích cực
                trong cộng đồng trên toàn thế giới.
              </p>
            </div>
            {siteTitleFooter.map((item) => (
              <div key={item.id}>
                <h3 className="font-semibold mb-4">{item.title}</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  {item.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href="/challenges"
                        className="hover:text-white transition-colors"
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="font-semibold mb-4">Kết nối</h3>
              <div className="flex space-x-4 mb-4">
                <Link
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </Link>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </Link>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </Link>
                <Link
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </Link>
              </div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Liên hệ với chúng tôi
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="hover:text-white transition-colors"
                  >
                    Ủng hộ
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 SkillTime. Bảo lưu mọi quyền.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

export default MyFooter;

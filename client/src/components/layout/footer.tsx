import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mt-8 border-t border-gray-200 pt-8 md:flex md:items-center md:justify-between">
          <div className="flex space-x-6 space-x-reverse md:order-2">
            <Link href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">شروط الاستخدام</span>
              الشروط والأحكام
            </Link>
            <Link href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">سياسة الخصوصية</span>
              سياسة الخصوصية
            </Link>
            <Link href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">الدعم الفني</span>
              الدعم الفني
            </Link>
          </div>
          <p className="mt-8 text-base text-gray-400 md:mt-0 md:order-1">
            &copy; {new Date().getFullYear()} نظام العلاوات والترفيعات. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

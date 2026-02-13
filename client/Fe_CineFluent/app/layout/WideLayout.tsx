type Props = {
  children: React.ReactNode;
  className?: string;
};

function MyWideLayout({ children, className = "" }: Props) {
  return (
    <div
      className={`w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {children}
    </div>
  );
}

export default MyWideLayout;

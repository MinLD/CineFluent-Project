type Props = {
  children: React.ReactNode;
};
function MyLayout({ children }: Props) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 ">{children}</div>
  );
}

export default MyLayout;

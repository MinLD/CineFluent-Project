type Props = {
  setClose: () => void;
  children: React.ReactNode;
};
function Modal_Show({ setClose, children }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40  flex items-center justify-center"
      onClick={() => setClose()}
    >
      <div
        className="bg-white p-4 w-[800px] h-auto rounded-xl shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default Modal_Show;

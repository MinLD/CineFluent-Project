export default function page() {
  return (
    // Thay h-full bằng h-screen.
    // Lưu ý: mt-10 (margin top) sẽ làm video bị đẩy xuống và xuất hiện thanh cuộn.
    <div className="w-full h-screen">
      <iframe
        src="https://vidsrc.xyz/embed/movie/tt0816692"
        className="w-full h-full" // Sử dụng class thay vì thuộc tính width/height nếu muốn linh hoạt
        frameBorder="0"
        allowFullScreen
      ></iframe>
    </div>
  );
}

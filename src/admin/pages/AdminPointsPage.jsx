import { useNavigate } from "react-router-dom";

export default function AdminPointsPage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <button onClick={() => navigate("/admin")}>
        ← Quay lại Dashboard
      </button>

      <h1>⭐ Quản lý điểm</h1>

      <p>
        Chức năng quản lý điểm sẽ được xây dựng ở bước tiếp theo.
      </p>
    </div>
  );
}
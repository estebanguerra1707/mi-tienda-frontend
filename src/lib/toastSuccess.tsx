import toast from "react-hot-toast";

export function toastSuccess(message: string) {
  toast.custom((t) => (
    <div
      className={`${
        t.visible ? "animate-enter" : "animate-leave"
      } px-4 py-3 rounded-md shadow-md`}
      style={{
        backgroundColor: "#22c55e",
        color: "white",
        fontWeight: 600,
        borderLeft: "6px solid #15803d",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      ✔ {message}
    </div>
  ));
}

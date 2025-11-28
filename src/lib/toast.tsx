import toast from "react-hot-toast";

export function toastError(message: string) {
  toast.custom((t) => (
    <div
      className={`${
        t.visible ? "animate-enter" : "animate-leave"
      } px-4 py-3 rounded-md shadow-md`}
      style={{
        backgroundColor: "#d32f2f",
        color: "white",
        borderLeft: "6px solid #b71c1c",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      ❌ {message}
    </div>
  ));
}

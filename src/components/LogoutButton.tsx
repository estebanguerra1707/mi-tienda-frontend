interface Props {
  onClick: () => void;
}

export default function LogoutButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        flex items-center gap-2
        px-3 py-2
        bg-red-600 text-white
        rounded-lg
        hover:bg-red-700
        active:scale-95
        transition
      "
    >
      🚪
      <span className="hidden sm:inline">Cerrar sesión</span>
    </button>
  );
}

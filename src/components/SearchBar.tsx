export default function SearchBar({
  value,
  onChange,
  className = "mb-8",
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) {
  return (
    <div className={`relative w-full max-w-2xl mx-auto ${className}`}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <svg
          className="w-5 h-5 text-muted"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 20 20"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
          />
        </svg>
      </div>
      <input
        type="search"
        className="block w-full p-4 pl-12 text-sm text-foreground bg-card border border-border rounded-full focus:ring-accent focus:border-accent outline-none transition-all placeholder-muted"
        placeholder="例：肩こり、腰痛、股関節、栄養、ピラティス、姿勢評価"
        value={value}
        onChange={onChange}
        required
      />
    </div>
  );
}

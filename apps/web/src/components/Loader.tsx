interface LoaderProps {
  size?: number;
  label?: string;
  className?: string;
}

export function Loader({ size = 72, label, className = '' }: LoaderProps) {
  const baseLabel = label?.replace(/\.+$/, '');

  return (
    <div className={`vk-loader ${className}`}>
      <svg
        className="vk-loader__svg"
        width={size}
        height={size * 1.35}
        viewBox="0 0 100 135"
        fill="none"
        aria-hidden="true"
      >
        <ellipse className="vk-loader__shadow" cx="50" cy="122" rx="17" ry="4.5" />
        <path
          className="vk-loader__hook"
          d="M30 34C27 14 44 2 62 6C82 10 89 30 75 44C66 53 54 53 51 71"
          stroke="var(--vk-primary)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <circle className="vk-loader__dot" cx="50" cy="103" r="9.5" fill="var(--vk-primary)" />
      </svg>
      {label && (
        <p className="vk-loader__label">
          {baseLabel}
          <span className="vk-loader__ellipsis" aria-hidden="true">
            <span className="vk-loader__ellipsis-dot">.</span>
            <span className="vk-loader__ellipsis-dot">.</span>
            <span className="vk-loader__ellipsis-dot">.</span>
          </span>
        </p>
      )}
    </div>
  );
}

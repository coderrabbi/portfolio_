export function BrandLogo() {
  return (
    <span className="coder-brand">
      <svg className="coder-brand-mark" viewBox="0 0 64 64" aria-hidden="true">
        <rect
          x="1"
          y="1"
          width="62"
          height="62"
          rx="18"
          fill="#0c1427"
          stroke="#416bc3"
          strokeWidth="2"
        />
        <path
          d="M27 20 14 32l13 12"
          fill="none"
          stroke="#80cfff"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M34 44V20h8a7 7 0 0 1 0 14h-8m8 0 9 10"
          fill="none"
          stroke="#f1f5ff"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <b className="coder-brand-wordmark">
        Coder<span>Rabbi</span>
        <i>.</i>
      </b>
    </span>
  );
}

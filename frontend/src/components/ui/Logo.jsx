import { cx } from '../../utils/cx';

// Marca do produto (desenho próprio): quadrado arredondado com uma linha de
// evolução. `inverse` ajusta o nome para fundos escuros.
function Logo({ inverse = false, className }) {
  return (
    <span className={cx('ui-logo', inverse && 'ui-logo--inverse', className)}>
      <svg
        className="ui-logo__mark"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="ui-logo-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#7a86fb" />
            <stop offset="1" stopColor="#4547e0" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#ui-logo-gradient)" />
        <path
          d="M8 21l5-5.5 4 3.5 7-8.5"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="10" r="2" fill="#fff" />
      </svg>
      <span className="ui-logo__name">
        Finance<span className="ui-logo__name-light"> System</span>
      </span>
    </span>
  );
}

export default Logo;

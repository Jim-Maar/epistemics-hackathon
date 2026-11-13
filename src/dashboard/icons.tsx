type IconProps = { size?: number };

const DEFAULT_ICON_SIZE = 14;

function Svg({ size = DEFAULT_ICON_SIZE, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const CheckIcon = (props: IconProps) => <Svg {...props}><path d="M3.5 8.5l3 3 6-7" /></Svg>;
export const CrossIcon = (props: IconProps) => <Svg {...props}><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" /></Svg>;
export const HalfIcon = (props: IconProps) => <Svg {...props}><path d="M4 8h8" /></Svg>;
export const AlertIcon = (props: IconProps) => <Svg {...props}><path d="M8 4.5v4M8 11.25v.25" /></Svg>;
export const ChevronIcon = (props: IconProps) => <Svg {...props}><path d="M6 4l4 4-4 4" /></Svg>;
export const CopyIcon = (props: IconProps) => <Svg {...props}><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" /><path d="M10.5 5.5V3.75A1.25 1.25 0 009.25 2.5h-5.5A1.25 1.25 0 002.5 3.75v5.5a1.25 1.25 0 001.25 1.25H5.5" /></Svg>;
export const SearchIcon = (props: IconProps) => <Svg {...props}><circle cx="7" cy="7" r="4.25" /><path d="M10.25 10.25L13.5 13.5" /></Svg>;

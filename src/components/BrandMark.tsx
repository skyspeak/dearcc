interface BrandMarkProps {
  size?: 'sm' | 'lg'
  as?: 'div' | 'h1'
}

export function BrandMark({ size = 'sm', as: Tag = 'div' }: BrandMarkProps) {
  const isLg = size === 'lg'
  const logoClass = isLg
    ? 'h-12 w-12 sm:h-16 sm:w-16'
    : 'h-7 w-7 sm:h-8 sm:w-8'

  return (
    <Tag
      className={`inline-flex items-center gap-2.5 sm:gap-3 font-serif font-medium tracking-tight text-ink ${
        isLg ? 'text-5xl sm:text-7xl justify-center' : 'text-xl'
      }`}
    >
      <img
        src={`${import.meta.env.BASE_URL}chinchilla.png`}
        alt=""
        aria-hidden="true"
        className={`${logoClass} shrink-0 rounded-sm [image-rendering:pixelated]`}
      />
      <span>
        <span>dear</span>
        <span className="text-primary">[</span>
        <span className="text-primary">CC</span>
        <span className="text-primary">]</span>
        <span> Field report</span>
      </span>
    </Tag>
  )
}

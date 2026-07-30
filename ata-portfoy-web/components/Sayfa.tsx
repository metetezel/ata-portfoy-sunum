import Image from "next/image";

// One fixed A4-landscape print page. Real mm units, not a scrollable web
// section — the actual weekly deliverable is printed and handed to clients,
// so every "sayfa" has to be dimensionally exact, not just look right on screen.
// Logo bottom-left, large page number top-right, decorative right-edge ribbon —
// matches the layout convention already established in the legacy PDF deck.
export function Sayfa({
  numara,
  arkaPlanGorseli,
  children,
}: {
  // The cover page carries no page number in the legacy deck — omit it there.
  numara?: number;
  // Cover-only photo panel (right side, fading into the white page) — leave
  // unset for every other page, which stay plain white per the legacy deck.
  arkaPlanGorseli?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="sayfa">
      {arkaPlanGorseli && (
        <div className="sayfa-kapak-gorseli">
          <Image src={arkaPlanGorseli} alt="" fill sizes="297mm" style={{ objectFit: "cover", objectPosition: "58% center" }} priority />
          {/* White fade as an SVG-painted rect, not a CSS `background` div —
              Chromium's print pipeline silently drops the whole image
              underneath a CSS-background overlay when "print backgrounds"
              is off (the default in a plain browser print dialog); SVG fill
              isn't treated as a background and always survives. */}
          <svg className="sayfa-kapak-gorseli-solma" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="kapakSolma" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="6%" stopColor="#ffffff" />
                <stop offset="48%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#kapakSolma)" />
          </svg>
        </div>
      )}

      {/* Geometric echo of the logo's mountain-peak mark, scaled up as the
          page accent — two overlapping rounded peaks rather than a hand-drawn
          ribbon, since crisp geometry reads as more deliberate/modern than an
          imitated organic curve. Dropped on the cover: it fought visually with
          the cover photo and read as clutter once that photo was in place. */}
      {!arkaPlanGorseli && (
        <svg className="sayfa-serit" viewBox="0 0 30 210" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            {/* Gradient stops anchor to the logo's exact sampled hex at the
                base (#D77210 / #036A7A) and lighten toward the tip — depth
                without drifting off the true brand color. */}
            <linearGradient id="seritTuruncu" x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0%" stopColor="#E5A364" />
              <stop offset="100%" stopColor="#D77210" />
            </linearGradient>
            <linearGradient id="seritTurkuaz" x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0%" stopColor="#5B9EA9" />
              <stop offset="100%" stopColor="#036A7A" />
            </linearGradient>
            <filter id="seritGolge" x="-60%" y="-10%" width="220%" height="130%">
              <feDropShadow dx="-0.5" dy="0.6" stdDeviation="0.7" floodColor="#0b1a20" floodOpacity="0.25" />
            </filter>
          </defs>
          <path
            d="M 0 210 L 20.5 11 Q 22 9 23.5 11 L 30 78 L 30 210 Z"
            fill="url(#seritTuruncu)"
            filter="url(#seritGolge)"
          />
          <path
            d="M 5 210 L 24.5 68 Q 26 66 27.3 68 L 30 108 L 30 210 Z"
            fill="url(#seritTurkuaz)"
            filter="url(#seritGolge)"
          />
        </svg>
      )}

      {numara !== undefined && <span className="sayfa-numara">{numara}</span>}

      <div className="sayfa-icerik">{children}</div>

      <Image
        src="/ata-portfoy-logo.png"
        alt="Ata Portföy"
        width={560}
        height={117}
        // Bigger on the cover only — every other page keeps the same small
        // corner mark at the same spot, per Mete's explicit instruction.
        className={arkaPlanGorseli ? "sayfa-logo sayfa-logo-kapak" : "sayfa-logo"}
        priority
      />
    </div>
  );
}

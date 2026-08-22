import { useEffect, useRef } from "react";
import Header from "./Header";
import { usePathname } from "next/navigation";

function PixelCube() {

  const speed = .75;
  const cols = 8;
  const rows= 6;
  return (
<div className="grid gap-y-0 items-center w-full  text-[#ACACAC]">
  <div
    className="z-10 [grid-area:1/1] [image-rendering:pixelated] bg-no-repeat"
    style={{
      "--tile": "128px",
      "--cols": cols,
      "--rows": rows,
      width: "var(--tile)",
      height: "var(--tile)",
      backgroundImage: "url(/graphics/pixel-cube-sheet.png)",
      backgroundSize: "calc(var(--cols) * var(--tile)) calc(var(--rows) * var(--tile))",
      animation: `spriteX ${speed}s steps(${cols}) infinite, spriteY ${speed * rows}s steps(${rows}) infinite`,
    }}
  />

</div>
  );
}

export default PixelCube;
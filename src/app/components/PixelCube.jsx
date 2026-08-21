import { useEffect, useRef } from "react";

function PixelCube() {

  const speed = .75;
  const cols = 8;
  const rows= 6;
  return (
<div className="grid place-items-center leading-[12rem] text-[#ACACAC]">
  <div className="[grid-area:1/1] z-0">
    <p className="text-center m-0 font-[Coral] text-[18rem]">GRAYBOX</p>
    <p className="text-center m-0 font-[Coral] text-[18rem]">ARCADE</p>
  </div>

  <div
    className="[grid-area:1/1] z-10 [image-rendering:pixelated] bg-no-repeat translate-x-[0px] translate-y-[0px]"
    style={{
      "--tile": "512px",
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
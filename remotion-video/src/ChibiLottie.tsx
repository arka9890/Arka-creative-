import { Lottie, LottieAnimationData } from "@remotion/lottie";
import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  staticFile,
} from "remotion";

// Official pattern from https://www.remotion.dev/docs/lottie/staticfile
export const ChibiLottie = () => {
  const [handle] = useState(() => delayRender("Loading Lottie animation"));
  const [animationData, setAnimationData] =
    useState<LottieAnimationData | null>(null);

  useEffect(() => {
    fetch(staticFile("gatin.json"))
      .then((data) => data.json())
      .then((json) => {
        setAnimationData(json);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle]);

  if (!animationData) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{ backgroundColor: "#ffffff", justifyContent: "center", alignItems: "center" }}
    >
      <Lottie animationData={animationData} loop style={{ width: 600, height: 600 }} />
    </AbsoluteFill>
  );
};

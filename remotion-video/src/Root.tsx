import { Composition } from "remotion";
import { MyVideo } from "./MyVideo";
import { Chibi } from "./Chibi";
import { ChibiLottie } from "./ChibiLottie";
import { ChibiGirl } from "./ChibiGirl";
import { StickmanVideo } from "./StickmanVideo";
import { Scene3D } from "./Scene3D";
import { CatsSlideshow } from "./CatsSlideshow";
import { CatsShort } from "./CatsShort";
import { TOTAL_F } from "./catsSchedule";
import { TestCube } from "./TestCube";
import { Probe } from "./Probe";
import { Elephant } from "./Elephant";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MyVideo"
        component={MyVideo}
        durationInFrames={120}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="Chibi"
        component={Chibi}
        durationInFrames={150}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="ChibiLottie"
        component={ChibiLottie}
        durationInFrames={80}
        fps={25}
        width={720}
        height={720}
      />
      <Composition
        id="ChibiGirl"
        component={ChibiGirl}
        durationInFrames={150}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="StickmanVideo"
        component={StickmanVideo}
        durationInFrames={1800}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="Probe"
        component={Probe}
        durationInFrames={10}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="TestCube"
        component={TestCube}
        durationInFrames={10}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="CatsSlideshow"
        component={CatsSlideshow}
        durationInFrames={1875}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="CatsShort"
        component={CatsShort}
        durationInFrames={TOTAL_F}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Scene3D"
        component={Scene3D}
        durationInFrames={10}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="Elephant"
        component={Elephant}
        durationInFrames={90}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};

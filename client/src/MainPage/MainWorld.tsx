import { Physics } from "@react-three/rapier";
import Light from "../GalleryPage/mapObjects/Light";
import Monument from "./mapObjects/Monument";
import Plane from "./mapObjects/Plane";

const MockMonumentData = {
  userName: "고세연",
  titles: ["WebProgramming", "HTML", "CSS"],
  galleryURL: "https://monumentgallery.ddns.net/gallery/2d3eef7f-c882-4097-ad72-05eed3a0c037/638da02ca04e896209e0e8b2",
};

export default function MainWorld() {
  return (
    <>
      <Physics gravity={[0, -30, 0]}>
        <Light />
        {/* <gridHelper args={[100, 100, 0]} /> */}
        <Monument data={MockMonumentData} />
        <Plane />
      </Physics>
    </>
  );
}

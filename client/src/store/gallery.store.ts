import create from "zustand";
import { gallerySelector } from "./selectors";
import { THEME } from "../constants/theme";
import type { IGalleryDataResponse, IGalleryMapData } from "../@types/gallery";

interface GalleryStore {
  data: IGalleryMapData;
  userId: string | null;
  theme: THEME | null;
  getData: (url: string) => IGalleryDataResponse;
  setData: (gallery: IGalleryMapData, userId: string) => void;
  setTheme: (theme: THEME) => void;
}

const galleryStore = create<GalleryStore>((set) => ({
  data: {
    nodes: [[]],
    pages: [],
    userName: "",
    totalKeywords: {},
    groupKeywords: [],
    theme: THEME.DREAM,
  },
  userId: null,
  theme: THEME.DREAM,
  getData: (url) => gallerySelector(url).data,
  setData: (data, userId) => set({ data, userId, theme: data.theme }),
  setTheme: (theme) => set({ theme }),
}));

export default galleryStore;

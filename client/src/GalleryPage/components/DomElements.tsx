import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Header from "../../components/Header";

import ShareWrapper from "./ShareWrapper";

import FloatLayout from "../../layouts/FloatLayout";
import UserInfo from "../../components/Header/UserInfo";
import ThemeSeletor from "../../components/ThemeSelector";
import Footer from "../../components/Footer";
import { Toast } from "../../components/Toast/Toast";

import lockStore from "../../store/lock.store";

import HistoryIcon from "../../assets/images/hamburger.svg";

// history side bar
import axios from "axios";
import FullScreenModal from "../../components/modal/FullScreenModal";
import galleryStore from "../../store/gallery.store";

import { IHistory } from "../../@types/gallery";

export default function DomElements({
  setRequestUrl,
}: {
  setRequestUrl: React.Dispatch<React.SetStateAction<string>>;
}) {
  const { locked } = lockStore();
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <>
      <div hidden={locked}>
        <FloatLayout>
          <Header>
            <UserInfo />
            <ThemeSeletor />
            <button>
              <img width={24} src={HistoryIcon} onClick={() => setShowSidebar(!showSidebar)} />
            </button>
          </Header>
          <ShareWrapper />
          <Footer />
        </FloatLayout>
        <HistorySidebar show={showSidebar} setShow={setShowSidebar} setRequestUrl={setRequestUrl} />
      </div>
      <Toast position="bottom-right" autoDelete={true} autoDeleteTime={2000} />
    </>
  );
}

function HistorySidebar({
  show,
  setShow,
  setRequestUrl,
}: {
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  setRequestUrl: React.Dispatch<React.SetStateAction<string>>;
}) {
  const historyRef = useRef<HTMLDivElement>(null);
  const historyListRef = useRef<HTMLDivElement>(null);

  const [scrollOffset, setScrollOffset] = useState(0);
  const [selected, setSelected] = useState(0);
  const [canScroll, setCanScroll] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [histories, setHistories] = useState<IHistory[]>([]);

  const data = galleryStore((store) => store.data);
  const userId = galleryStore((store) => store.userId);

  useLayoutEffect(() => {
    if (!userId) return;
    axios.get<IHistory[]>(`/api/history/${userId}`).then((res) => {
      if (!res.data) return;
      setHistories(res.data);
      const idx = res.data.findIndex((history) => history.id === data.id);
      setScrollOffset(idx);
      setSelected(idx);
    });
  }, [userId, data]);

  useEffect(() => {
    if (canScroll) return;
    const scrollTimeout = setTimeout(() => {
      setCanScroll(true);
    }, 20);
    return () => clearTimeout(scrollTimeout);
  }, [canScroll]);

  useEffect(() => {
    const offset = Math.abs(selected - scrollOffset);
    if (offset >= 1) {
      if (!historyListRef.current) return;
      setSelected(parseInt("" + scrollOffset));
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const height = historyListRef.current.querySelector("div")!.clientHeight - historyListRef.current.clientHeight;
      const length = histories.length - 2;
      const scr = height / length;
      historyListRef.current.scrollTop = -scr + selected * scr;
    }

    const scrollHandler = (e: WheelEvent) => {
      if (!canScroll || Math.abs(e.deltaY) < 10) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      if (dir < 0 && selected <= 0) return;
      if (dir > 0 && selected >= histories.length - 1) return;
      setScrollOffset(scrollOffset + dir);
      setCanScroll(false);
    };
    historyRef.current?.addEventListener("wheel", scrollHandler);
    return () => historyRef.current?.removeEventListener("wheel", scrollHandler);
  }, [scrollOffset, canScroll]);

  function setGalleryDataFromHistory() {
    const history = histories[selected];
    const url = `/api/gallery/${userId}/${history.id}`;
    setRequestUrl(url);
    setShow(false);
    setShowHistoryModal(false);
  }

  function onHistoryClick(distanceToSelected: number) {
    if (distanceToSelected) {
      const newSelected = selected + distanceToSelected;
      setSelected(newSelected);
      setScrollOffset(newSelected);
      return;
    }
    setShowHistoryModal(true);
  }

  return (
    <div ref={historyRef} className="history-sidebar" style={{ display: show ? "block" : "none" }}>
      <div className="dimmed" onClick={() => setShow(false)} />
      <div ref={historyListRef} className="history-list">
        <div>
          {histories.map((history, i) => (
            <HistoryItem
              key={history.id}
              distanceToSelected={i - selected}
              history={history}
              onClick={onHistoryClick}
            />
          ))}
        </div>
      </div>
      {showHistoryModal && (
        <FullScreenModal
          css={{ width: "300px", height: "200px" }}
          show={showHistoryModal}
          setShow={setShowHistoryModal}
        >
          <div className="modal history-modal">
            <div>
              {histories[selected].id === data.id ? "현재 히스토리 데이터입니다." : "새로운 데이터를 불러옵니다."}
            </div>
            <div className="history-modal-data">
              <span>
                {histories[selected].date} - {histories[selected].time}
              </span>
              <br />
              <span>{histories[selected].id}</span>
            </div>
            <div className="history-modal-buttons">
              <button className="history-get-button" onClick={() => setGalleryDataFromHistory()}>
                불러오기
              </button>
              <button className="history-cancel-button" onClick={() => setShowHistoryModal(false)}>
                취소
              </button>
            </div>
          </div>
        </FullScreenModal>
      )}
    </div>
  );
}

function HistoryItem({
  distanceToSelected,
  history,
  onClick,
}: {
  distanceToSelected: number;
  history: IHistory;
  onClick: (distanceToSelected: number) => void;
}) {
  const [hover, setHover] = useState(false);
  const data = galleryStore((store) => store.data);
  const offset = useMemo(() => Math.abs(distanceToSelected), [distanceToSelected]);

  return (
    <div key={history.id} className="history">
      {(hover || !distanceToSelected) && <span className="history-time">{history.time}</span>}
      <span
        style={history.id === data.id ? { backgroundColor: "#ffffff", color: "#222222" } : {}}
        className={`history-item history-item-${offset <= 4 ? offset : "plain"}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => onClick(distanceToSelected)}
      >
        {history.date}
      </span>
    </div>
  );
}

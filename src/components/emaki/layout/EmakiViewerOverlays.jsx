// 1. モーダル・FAB・フィードバック系オーバーレイ
// scroll / クイズ / プロンプト条件に応じた重ね表示を EmakiConteiner から分離する。

import dynamic from "next/dynamic";

const HelpModal = dynamic(
  () => import("@/components/emaki/viewer/HelpModal"),
  { ssr: false }
);
const QuizFab = dynamic(
  () => import("@/components/emaki/quiz/QuizFab"),
  { ssr: false }
);
const QuizModal = dynamic(
  () => import("@/components/emaki/quiz/QuizModal"),
  { ssr: false }
);
const PolaroidModal = dynamic(
  () => import("@/components/emaki/viewer/PolaroidModal").then(
    (mod) => mod.PolaroidModal || mod.default || mod
  ),
  { ssr: false }
);
const ScrollFeedbackPanel = dynamic(
  () => import("@/components/emaki/viewer/ScrollFeedbackPanel"),
  { ssr: false }
);
const ViewerPullPrompt = dynamic(
  () => import("@/components/emaki/viewer/ViewerPullPrompt"),
  { ssr: false }
);
const ScrollFeedbackEndPrompt = dynamic(
  () => import("@/components/emaki/viewer/ScrollFeedbackEndPrompt"),
  { ssr: false }
);

export function EmakiViewerOverlays({
  scroll,
  isHelpModalOpen,
  isPolaroidModalOpen,
  processedEmakis,
  data,
  polaroidSceneIndex,
  polaroidInitialZoom,
  polaroidInitialPan,
  polaroidModalKey,
  handleClosePolaroidModal,
  canShowQuizChrome,
  openQuizUi,
  isUIVisible,
  fabMode,
  activeQuiz,
  quizSession,
  quizUi,
  emakiId,
  handleQuizSessionChange,
  closeQuizUi,
  abandonQuizUi,
  handleQuizJumpLocal,
  handleQuizJumpScroll,
  isScrollFeedbackOpen,
  setIsScrollFeedbackOpen,
  getScrollRatio,
  locale,
  handleScrollFeedbackSubmitted,
  showSharePullPrompt,
  handleSharePromptCopy,
  dismissSharePrompt,
  showMidFeedbackPrompt,
  handleMidFeedbackPrimary,
  dismissMidFeedbackPrompt,
  showScrollFeedbackEndPrompt,
  dismissEndPrompt,
  shareTitle,
  navIndex,
  liveSceneIndex,
  scrollFeedbackSubmitted,
}) {
  return (
    <>
      {scroll && isHelpModalOpen && <HelpModal />}
      {scroll && isPolaroidModalOpen && (
        <PolaroidModal
          scenes={processedEmakis ?? []}
          emakiTitle={data?.title}
          initialIndex={polaroidSceneIndex}
          initialZoom={polaroidInitialZoom}
          initialPan={polaroidInitialPan}
          isOpen={isPolaroidModalOpen}
          key={polaroidModalKey}
          onClose={handleClosePolaroidModal}
          title={data?.title}
          titleen={data?.titleen}
        />
      )}
      {canShowQuizChrome && (
        <QuizFab
          onOpen={openQuizUi}
          isUIVisible={isUIVisible}
          mode={fabMode}
          variant="float"
        />
      )}
      {scroll && activeQuiz && quizSession && quizUi === "open" && (
        <QuizModal
          quiz={activeQuiz}
          emakiId={emakiId}
          emakis={data.emakis}
          session={quizSession}
          onSessionChange={handleQuizSessionChange}
          onClose={closeQuizUi}
          onAbandon={abandonQuizUi}
          onMinimizeAndJumpLocal={handleQuizJumpLocal}
          onMinimizeAndJumpScroll={handleQuizJumpScroll}
        />
      )}
      {scroll && isScrollFeedbackOpen && (
        <ScrollFeedbackPanel
          emakiId={emakiId}
          sceneIndex={navIndex}
          getScrollRatio={getScrollRatio}
          locale={locale}
          onClose={() => setIsScrollFeedbackOpen(false)}
          onSubmitted={handleScrollFeedbackSubmitted}
        />
      )}
      {scroll && showSharePullPrompt && (
        <ViewerPullPrompt
          mode="share"
          isVisible
          onPrimary={handleSharePromptCopy}
          onDismiss={dismissSharePrompt}
        />
      )}
      {scroll && showMidFeedbackPrompt && (
        <ViewerPullPrompt
          mode="mid_feedback"
          isVisible
          onPrimary={handleMidFeedbackPrimary}
          onDismiss={dismissMidFeedbackPrompt}
        />
      )}
      {scroll && showScrollFeedbackEndPrompt && (
        <ScrollFeedbackEndPrompt
          isVisible
          onOpenFeedback={() => setIsScrollFeedbackOpen(true)}
          onDismiss={dismissEndPrompt}
          emakiId={emakiId}
          shareTitle={shareTitle}
          navIndex={liveSceneIndex}
          showFeedback={!scrollFeedbackSubmitted}
        />
      )}
    </>
  );
}

// 2. Ebiki 開発 HUD
export { EbikiCoordinatePickerHud } from "@/components/dev/EbikiCoordinatePicker";
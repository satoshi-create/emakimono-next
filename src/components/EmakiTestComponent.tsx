// src/components/EmakiTestComponent.tsx

import { EmakiChapter } from "@/types/emaki";

const EmakiTestComponent = () => {
  const sampleChapter: EmakiChapter = {
    id: "chapter-1",
    title: "はじめの章",
    imageUrl: "/images/sample.jpg",
  };

  return (
    <div>
      <h2>Test Emaki Chapter</h2>
      <p>ID: {sampleChapter.id}</p>
      <p>Title: {sampleChapter.title}</p>
      <p>Image: {sampleChapter.imageUrl}</p>
    </div>
  );
};

export default EmakiTestComponent;

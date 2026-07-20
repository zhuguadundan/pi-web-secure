"use client";

import { useState, useCallback, useRef } from "react";

function hasFileItems(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.types).includes("Files")
    || Array.from(dataTransfer.items).some((item) => item.kind === "file");
}

export function splitDroppedFiles(files: File[]): { images: File[]; documents: File[] } {
  const images: File[] = [];
  const documents: File[] = [];
  for (const file of files) {
    if (file.type.startsWith("image/")) images.push(file);
    else documents.push(file);
  }
  return { images, documents };
}

export function useDragDrop(onDrop: (files: File[]) => void) {
  const [isDragOver, setIsDragOver] = useState(false);
  const counterRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (!hasFileItems(e.dataTransfer)) return;
    e.preventDefault();
    counterRef.current += 1;
    setIsDragOver(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!hasFileItems(e.dataTransfer)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDragLeave = useCallback(() => {
    counterRef.current -= 1;
    if (counterRef.current <= 0) {
      counterRef.current = 0;
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!hasFileItems(e.dataTransfer)) return;
    e.preventDefault();
    counterRef.current = 0;
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((file) => file.name && file.size >= 0);
    if (files.length > 0) onDrop(files);
  }, [onDrop]);

  return { isDragOver, handleDragEnter, handleDragOver, handleDragLeave, handleDrop };
}
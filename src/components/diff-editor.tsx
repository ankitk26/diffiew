import { Button } from "@/components/ui/button";
import {
  computeDiff,
  enhanceWithCharDiffs,
  type CharDiff,
  type DiffLine,
} from "@/lib/diff";
import { cn } from "@/lib/utils";
import {
  IconArrowsLeftRight,
  IconCopy,
  IconFileUpload,
  IconMinus,
  IconPlus,
} from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface DiffEditorProps {
  left: string;
  right: string;
  leftTitle?: string;
  rightTitle?: string;
  onLeftChange?: (value: string) => void;
  onRightChange?: (value: string) => void;
  leftFileInputRef?: React.RefObject<HTMLInputElement>;
  rightFileInputRef?: React.RefObject<HTMLInputElement>;
  onLeftFileClick?: () => void;
  onRightFileClick?: () => void;
  onLeftFileLoad?: (file: File) => void;
  onRightFileLoad?: (file: File) => void;
}

export function DiffEditor({
  left,
  right,
  leftTitle = "Original",
  rightTitle = "Modified",
  onLeftChange,
  onRightChange,
  leftFileInputRef,
  rightFileInputRef,
  onLeftFileClick,
  onRightFileClick,
  onLeftFileLoad,
  onRightFileLoad,
}: DiffEditorProps) {
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  // Compute diff whenever left or right changes - always with character-level diffs
  useEffect(() => {
    const diff = computeDiff(left, right);
    const enhancedDiff = enhanceWithCharDiffs(diff);
    setDiffLines(enhancedDiff);
  }, [left, right]);

  // Calculate diff statistics
  const diffStats = {
    added: diffLines.filter((l) => l.type === "insert").length,
    removed: diffLines.filter((l) => l.type === "delete").length,
    modified: diffLines.filter((l) => l.type === "modify").length,
    totalLines: Math.max(
      diffLines.filter((l) => l.leftLineNumber).length,
      diffLines.filter((l) => l.rightLineNumber).length
    ),
  };

  const handleCopyLeft = () => {
    navigator.clipboard.writeText(left);
  };

  const handleCopyRight = () => {
    navigator.clipboard.writeText(right);
  };

  const handleSwap = () => {
    const temp = left;
    onLeftChange?.(right);
    onRightChange?.(temp);
  };

  // Synchronized scrolling
  const handleLeftScroll = useCallback(() => {
    if (isScrollingRef.current) return;
    if (leftScrollRef.current && rightScrollRef.current) {
      isScrollingRef.current = true;
      rightScrollRef.current.scrollTop = leftScrollRef.current.scrollTop;
      requestAnimationFrame(() => {
        isScrollingRef.current = false;
      });
    }
  }, []);

  const handleRightScroll = useCallback(() => {
    if (isScrollingRef.current) return;
    if (leftScrollRef.current && rightScrollRef.current) {
      isScrollingRef.current = true;
      leftScrollRef.current.scrollTop = rightScrollRef.current.scrollTop;
      requestAnimationFrame(() => {
        isScrollingRef.current = false;
      });
    }
  }, []);

  const renderCharDiff = (charDiffs: CharDiff[], isLeft: boolean) => {
    // Render transparent text with visible background highlights
    // Text must be present to take up space for proper alignment, but transparent so it doesn't show through textarea
    return charDiffs.map((charDiff, idx) => {
      // For left side: show deletions with darker rose background
      // For right side: show insertions with darker emerald background
      const className =
        charDiff.type === "delete" && isLeft
          ? "bg-rose-500/50 dark:bg-rose-500/60 text-transparent"
          : charDiff.type === "insert" && !isLeft
          ? "bg-emerald-500/50 dark:bg-emerald-500/60 text-transparent"
          : "text-transparent";
      // Use inline to avoid gaps, but ensure whitespace is preserved
      return (
        <span key={idx} className={className} style={{ whiteSpace: "pre" }}>
          {charDiff.text}
        </span>
      );
    });
  };

  const renderLine = (
    line: DiffLine,
    index: number,
    side: "left" | "right"
  ) => {
    const isLeft = side === "left";
    const lineContent = isLeft ? line.leftLine : line.rightLine;
    const lineNumber = isLeft ? line.leftLineNumber : line.rightLineNumber;
    const charDiffs = isLeft ? line.leftCharDiffs : line.rightCharDiffs;

    // Determine if this line should be shown for this side
    const shouldShow =
      (isLeft && (line.leftLine !== undefined || line.type === "delete")) ||
      (!isLeft && (line.rightLine !== undefined || line.type === "insert"));

    if (!shouldShow) {
      // Empty line for the other side (spacer)
      const bgColor =
        line.type === "delete" && isLeft
          ? "bg-rose-500/10 dark:bg-rose-500/20"
          : line.type === "insert" && !isLeft
          ? "bg-emerald-500/10 dark:bg-emerald-500/20"
          : line.type === "modify" && isLeft
          ? "bg-rose-500/10 dark:bg-rose-500/20"
          : line.type === "modify" && !isLeft
          ? "bg-emerald-500/10 dark:bg-emerald-500/20"
          : "";

      return (
        <div
          key={`${side}-${index}`}
          className={cn("flex min-h-[20px]", bgColor)}
        >
          <div
            className="shrink-0 w-10 px-2 text-right text-xs text-muted-foreground select-none"
            style={{ lineHeight: "20px" }}
          >
            {" "}
          </div>
          <div
            className="flex-1 px-2 font-mono text-xs leading-5 whitespace-pre-wrap wrap-break-word"
            style={{ lineHeight: "20px" }}
          >
            <span className="text-transparent"> </span>
          </div>
        </div>
      );
    }

    // Light background for the whole line - rose for left, emerald for right
    const bgColor =
      line.type === "delete" && isLeft
        ? "bg-rose-500/10 dark:bg-rose-500/20"
        : line.type === "insert" && !isLeft
        ? "bg-emerald-500/10 dark:bg-emerald-500/20"
        : line.type === "modify" && isLeft
        ? "bg-rose-500/10 dark:bg-rose-500/20"
        : line.type === "modify" && !isLeft
        ? "bg-emerald-500/10 dark:bg-emerald-500/20"
        : "";

    // Calculate line height based on content (handle multi-line content)
    const lineHeight = lineContent
      ? Math.max(20, (lineContent.match(/\n/g) || []).length * 20 + 20)
      : 20;

    return (
      <div
        key={`${side}-${index}`}
        className={cn("flex min-h-[20px]", bgColor)}
        style={{ minHeight: `${lineHeight}px` }}
      >
        <div
          className="shrink-0 w-10 px-2 text-right text-xs text-muted-foreground select-none leading-5 font-mono"
          style={{ lineHeight: "20px" }}
        >
          {lineNumber || " "}
        </div>
        <div
          className="flex-1 px-2 font-mono text-xs leading-5 whitespace-pre-wrap wrap-break-word"
          style={{ lineHeight: "20px", letterSpacing: "normal" }}
        >
          {/* Show character-level diff highlighting with transparent text for alignment */}
          {charDiffs ? (
            <span style={{ whiteSpace: "pre", letterSpacing: "inherit" }}>
              {renderCharDiff(charDiffs, isLeft)}
            </span>
          ) : (
            <span className="text-transparent">{lineContent || " "}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex bg-muted/30 border-b border-border">
        <div className="flex-1 px-4 py-2 flex items-center gap-2">
          <div className="text-xs font-medium text-foreground">{leftTitle}</div>
          {leftFileInputRef && onLeftFileClick && (
            <>
              <input
                ref={leftFileInputRef}
                type="file"
                accept=".txt,.js,.ts,.jsx,.tsx,.json,.md,.css,.html"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && onLeftFileLoad) onLeftFileLoad(file);
                }}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onLeftFileClick}
                title="Load file"
                className="h-6 w-6"
              >
                <IconFileUpload className="size-3" />
              </Button>
            </>
          )}
          {diffStats.removed > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <IconMinus className="size-3 text-rose-600 dark:text-rose-400" />
              <span>
                {diffStats.removed}{" "}
                {diffStats.removed === 1 ? "removal" : "removals"}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleCopyLeft}
              title="Copy left"
              className="h-6 w-6"
            >
              <IconCopy className="size-3" />
            </Button>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>
              {diffStats.totalLines}{" "}
              {diffStats.totalLines === 1 ? "line" : "lines"}
            </span>
          </div>
        </div>
        <div className="px-2 flex items-center">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleSwap}
            title="Swap editors"
            className="h-6 w-6"
          >
            <IconArrowsLeftRight className="size-3" />
          </Button>
        </div>
        <div className="flex-1 px-4 py-2 flex items-center gap-2">
          <div className="text-xs font-medium text-foreground">
            {rightTitle}
          </div>
          {rightFileInputRef && onRightFileClick && (
            <>
              <input
                ref={rightFileInputRef}
                type="file"
                accept=".txt,.js,.ts,.jsx,.tsx,.json,.md,.css,.html"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && onRightFileLoad) onRightFileLoad(file);
                }}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onRightFileClick}
                title="Load file"
                className="h-6 w-6"
              >
                <IconFileUpload className="size-3" />
              </Button>
            </>
          )}
          {diffStats.added > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <IconPlus className="size-3 text-emerald-600 dark:text-emerald-400" />
              <span>
                {diffStats.added}{" "}
                {diffStats.added === 1 ? "addition" : "additions"}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleCopyRight}
              title="Copy right"
              className="h-6 w-6"
            >
              <IconCopy className="size-3" />
            </Button>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>
              {diffStats.totalLines}{" "}
              {diffStats.totalLines === 1 ? "line" : "lines"}
            </span>
          </div>
        </div>
      </div>

      {/* Editor Panes */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane - Editable */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background border-r border-border relative">
          {/* Diff overlay - behind textarea */}
          <div
            ref={leftScrollRef}
            onScroll={handleLeftScroll}
            className="absolute inset-0 overflow-y-auto overflow-x-auto pointer-events-none z-0"
          >
            <div className="min-w-full">
              {diffLines.map((line, index) => renderLine(line, index, "left"))}
            </div>
          </div>
          {/* Editable textarea - on top */}
          <textarea
            value={left}
            onChange={(e) => onLeftChange?.(e.target.value)}
            onScroll={(e) => {
              if (leftScrollRef.current) {
                leftScrollRef.current.scrollTop = e.currentTarget.scrollTop;
                leftScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
              }
              handleLeftScroll();
            }}
            className="relative z-10 flex-1 w-full pl-12 pr-2 py-0 font-mono text-xs leading-5 whitespace-pre-wrap wrap-break-word bg-transparent text-foreground caret-foreground resize-none outline-none border-0"
            style={{
              tabSize: 2,
              lineHeight: "20px",
              letterSpacing: "normal",
            }}
            spellCheck={false}
          />
        </div>
        {/* Right Pane - Editable */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background border-l border-border relative">
          {/* Diff overlay - behind textarea */}
          <div
            ref={rightScrollRef}
            onScroll={handleRightScroll}
            className="absolute inset-0 overflow-y-auto overflow-x-auto pointer-events-none z-0"
          >
            <div className="min-w-full">
              {diffLines.map((line, index) => renderLine(line, index, "right"))}
            </div>
          </div>
          {/* Editable textarea - on top */}
          <textarea
            value={right}
            onChange={(e) => onRightChange?.(e.target.value)}
            onScroll={(e) => {
              if (rightScrollRef.current) {
                rightScrollRef.current.scrollTop = e.currentTarget.scrollTop;
                rightScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
              }
              handleRightScroll();
            }}
            className="relative z-10 flex-1 w-full pl-12 pr-2 py-0 font-mono text-xs leading-5 whitespace-pre-wrap wrap-break-word bg-transparent text-foreground caret-foreground resize-none outline-none border-0"
            style={{
              tabSize: 2,
              lineHeight: "20px",
              letterSpacing: "normal",
            }}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

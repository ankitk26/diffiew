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
import { useCallback, useMemo, useRef } from "react";

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
	const diffLines = useMemo(() => {
		const diff = computeDiff(left, right);
		return enhanceWithCharDiffs(diff);
	}, [left, right]);
	const leftScrollRef = useRef<HTMLDivElement>(null);
	const rightScrollRef = useRef<HTMLDivElement>(null);
	const isScrollingRef = useRef(false);

	const diffStats = {
		added: diffLines.filter((l) => l.type === "insert").length,
		removed: diffLines.filter((l) => l.type === "delete").length,
		modified: diffLines.filter((l) => l.type === "modify").length,
		totalLines: Math.max(
			diffLines.filter((l) => l.leftLineNumber).length,
			diffLines.filter((l) => l.rightLineNumber).length,
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
		return charDiffs.map((charDiff, idx) => {
			const className =
				charDiff.type === "delete" && isLeft
					? "bg-rose-500/40 dark:bg-rose-400/30 text-transparent rounded-sm"
					: charDiff.type === "insert" && !isLeft
						? "bg-emerald-500/40 dark:bg-emerald-400/30 text-transparent rounded-sm"
						: "text-transparent";
			return (
				<span key={idx} className={cn(className, "whitespace-pre")}>
					{charDiff.text}
				</span>
			);
		});
	};

	const renderLine = (
		line: DiffLine,
		index: number,
		side: "left" | "right",
	) => {
		const isLeft = side === "left";
		const lineContent = isLeft ? line.leftLine : line.rightLine;
		const lineNumber = isLeft ? line.leftLineNumber : line.rightLineNumber;
		const charDiffs = isLeft ? line.leftCharDiffs : line.rightCharDiffs;

		const shouldShow =
			(isLeft &&
				(line.leftLine !== undefined || line.type === "delete")) ||
			(!isLeft &&
				(line.rightLine !== undefined || line.type === "insert"));

		if (!shouldShow) {
			const bgColor =
				line.type === "delete" && isLeft
					? "bg-rose-500/5 dark:bg-rose-500/10"
					: line.type === "insert" && !isLeft
						? "bg-emerald-500/5 dark:bg-emerald-500/10"
						: line.type === "modify" && isLeft
							? "bg-rose-500/5 dark:bg-rose-500/10"
							: line.type === "modify" && !isLeft
								? "bg-emerald-500/5 dark:bg-emerald-500/10"
								: "";

			return (
				<div
					key={`${side}-${index}`}
					className={cn("flex h-5", bgColor)}
				>
					<div className="shrink-0 w-10 px-2 text-right text-[10px] text-muted-foreground/50 select-none leading-code tabular-nums" />
					<div className="flex-1 px-3 text-code leading-code whitespace-pre break-all">
						<span className="text-transparent">&nbsp;</span>
					</div>
				</div>
			);
		}

		const bgColor =
			line.type === "delete" && isLeft
				? "bg-rose-500/8 dark:bg-rose-500/15"
				: line.type === "insert" && !isLeft
					? "bg-emerald-500/8 dark:bg-emerald-500/15"
					: line.type === "modify" && isLeft
						? "bg-rose-500/8 dark:bg-rose-500/15"
						: line.type === "modify" && !isLeft
							? "bg-emerald-500/8 dark:bg-emerald-500/15"
							: "";

		const gutterColor =
			line.type === "delete" && isLeft
				? "text-rose-600/60 dark:text-rose-400/60"
				: line.type === "insert" && !isLeft
					? "text-emerald-600/60 dark:text-emerald-400/60"
					: line.type === "modify" && isLeft
						? "text-rose-600/60 dark:text-rose-400/60"
						: line.type === "modify" && !isLeft
							? "text-emerald-600/60 dark:text-emerald-400/60"
							: "text-muted-foreground/40";

		return (
			<div
				key={`${side}-${index}`}
				className={cn("flex min-h-5", bgColor)}
			>
				<div
					className={cn(
						"shrink-0 w-10 px-2 text-right text-[10px] select-none leading-code tabular-nums",
						gutterColor,
					)}
				>
					{lineNumber || ""}
				</div>
				<div className="flex-1 px-3 text-code leading-code whitespace-pre break-all">
					{charDiffs ? (
						<span className="whitespace-pre">
							{renderCharDiff(charDiffs, isLeft)}
						</span>
					) : (
						<span className="text-transparent">
							{lineContent || " "}
						</span>
					)}
				</div>
			</div>
		);
	};

	return (
		<div className="flex flex-col h-full bg-background">
			{/* Toolbar */}
			<div className="shrink-0 flex items-stretch border-b border-border/50 bg-muted/30">
				{/* Left Panel Header */}
				<div className="flex-1 flex items-center gap-3 px-4 py-2">
					<span className="text-code font-medium text-foreground/80">
						{leftTitle}
					</span>

					{leftFileInputRef && onLeftFileClick && (
						<>
							<input
								ref={leftFileInputRef}
								type="file"
								accept=".txt,.js,.ts,.jsx,.tsx,.json,.md,.css,.html"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file && onLeftFileLoad)
										onLeftFileLoad(file);
								}}
								className="hidden"
							/>
							<Button
								variant="ghost"
								size="icon-xs"
								onClick={onLeftFileClick}
								title="Load file"
								className="text-muted-foreground hover:text-foreground"
							>
								<IconFileUpload className="size-3" />
							</Button>
						</>
					)}

					<div className="flex-1" />

					{diffStats.removed > 0 && (
						<div className="flex items-center gap-1.5 text-code text-rose-600 dark:text-rose-400">
							<IconMinus className="size-3" />
							<span>{diffStats.removed}</span>
						</div>
					)}

					<Button
						variant="ghost"
						size="icon-xs"
						onClick={handleCopyLeft}
						title="Copy"
						className="text-muted-foreground hover:text-foreground"
					>
						<IconCopy className="size-3" />
					</Button>
				</div>

				{/* Center Divider with Swap */}
				<div className="flex w-10 items-stretch border-x border-border/50">
					<Button
						variant="ghost"
						onClick={handleSwap}
						title="Swap"
						className="h-full w-full rounded-none text-muted-foreground hover:text-foreground"
					>
						<IconArrowsLeftRight className="size-3" />
					</Button>
				</div>

				{/* Right Panel Header */}
				<div className="flex-1 flex items-center gap-3 px-4 py-2">
					<span className="text-code font-medium text-foreground/80">
						{rightTitle}
					</span>

					{rightFileInputRef && onRightFileClick && (
						<>
							<input
								ref={rightFileInputRef}
								type="file"
								accept=".txt,.js,.ts,.jsx,.tsx,.json,.md,.css,.html"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file && onRightFileLoad)
										onRightFileLoad(file);
								}}
								className="hidden"
							/>
							<Button
								variant="ghost"
								size="icon-xs"
								onClick={onRightFileClick}
								title="Load file"
								className="text-muted-foreground hover:text-foreground"
							>
								<IconFileUpload className="size-3" />
							</Button>
						</>
					)}

					<div className="flex-1" />

					{diffStats.added > 0 && (
						<div className="flex items-center gap-1.5 text-code text-emerald-600 dark:text-emerald-400">
							<IconPlus className="size-3" />
							<span>{diffStats.added}</span>
						</div>
					)}

					<Button
						variant="ghost"
						size="icon-xs"
						onClick={handleCopyRight}
						title="Copy"
						className="text-muted-foreground hover:text-foreground"
					>
						<IconCopy className="size-3" />
					</Button>
				</div>
			</div>

			{/* Editor Panels */}
			<div className="flex flex-1 overflow-hidden">
				{/* Left Panel */}
				<div className="flex-1 flex flex-col overflow-hidden relative">
					{/* Diff Overlay */}
					<div
						ref={leftScrollRef}
						onScroll={handleLeftScroll}
						className="absolute inset-0 overflow-auto pointer-events-none z-0"
					>
						<div className="min-w-full">
							{diffLines.map((line, index) =>
								renderLine(line, index, "left"),
							)}
						</div>
					</div>
					{/* Editable Textarea */}
					<textarea
						value={left}
						onChange={(e) => onLeftChange?.(e.target.value)}
						onScroll={(e) => {
							if (leftScrollRef.current) {
								leftScrollRef.current.scrollTop =
									e.currentTarget.scrollTop;
								leftScrollRef.current.scrollLeft =
									e.currentTarget.scrollLeft;
							}
							handleLeftScroll();
						}}
						className="relative z-10 flex-1 w-full pl-[52px] pr-3 py-0 text-code leading-code whitespace-pre break-all bg-transparent text-foreground caret-primary resize-none outline-none border-0"
						spellCheck={false}
					/>
				</div>

				{/* Divider */}
				<div className="w-px bg-border/50" />

				{/* Right Panel */}
				<div className="flex-1 flex flex-col overflow-hidden relative">
					{/* Diff Overlay */}
					<div
						ref={rightScrollRef}
						onScroll={handleRightScroll}
						className="absolute inset-0 overflow-auto pointer-events-none z-0"
					>
						<div className="min-w-full">
							{diffLines.map((line, index) =>
								renderLine(line, index, "right"),
							)}
						</div>
					</div>
					{/* Editable Textarea */}
					<textarea
						value={right}
						onChange={(e) => onRightChange?.(e.target.value)}
						onScroll={(e) => {
							if (rightScrollRef.current) {
								rightScrollRef.current.scrollTop =
									e.currentTarget.scrollTop;
								rightScrollRef.current.scrollLeft =
									e.currentTarget.scrollLeft;
							}
							handleRightScroll();
						}}
						className="relative z-10 flex-1 w-full pl-[52px] pr-3 py-0 text-code leading-code whitespace-pre break-all bg-transparent text-foreground caret-primary resize-none outline-none border-0"
						spellCheck={false}
					/>
				</div>
			</div>
		</div>
	);
}
